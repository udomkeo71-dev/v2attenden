import { NextRequest, NextResponse } from "next/server";

interface TelegramRequestBody {
  token?: string;
  chatId?: string;
  message: string;
  photoBase64?: string;
  sendAsText?: boolean;
  isTest?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: TelegramRequestBody = await req.json();
    const { message, photoBase64, sendAsText = false, isTest = false } = body;
    const DEFAULT_TOKEN = "8958163929:AAF7JduKMqPYdLiFR2dmJWB0zKt_xvyYyEY";
    const DEFAULT_CHAT_ID = "7770204305";

    const token =
      body.token && body.token.trim() !== ""
        ? body.token
        : process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TOKEN;
    const chatId =
      body.chatId && body.chatId.trim() !== ""
        ? body.chatId
        : process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

    // If test request
    if (isTest) {
      if (!token || !chatId) {
        return NextResponse.json(
          { success: false, error: "សូមបញ្ចូល Telegram Bot Token និង Chat ID ជាមុនសិន" },
          { status: 400 }
        );
      }

      const testUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const testRes = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔔 <b>តេស្តប្រព័ន្ធ Telegram Bot ជោគជ័យ!</b>\nប្រព័ន្ធកត់ត្រាវត្តមាន V2 Education បានភ្ជាប់ទំនាក់ទំនងជាមួយ Telegram រួចរាល់ហើយ។`,
          parse_mode: "HTML",
        }),
      });

      const data = await testRes.json();
      if (!testRes.ok || !data.ok) {
        return NextResponse.json(
          { success: false, error: data.description || "ការភ្ជាប់ Telegram មិនបានសម្រេច" },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: "ការតេស្តភ្ជាប់ Telegram បានជោគជ័យ!" });
    }

    // Normal attendance dispatch
    if (!token || !chatId || token === "your_telegram_bot_token_here") {
      // Return simulated success with notification
      return NextResponse.json({
        success: true,
        isSimulated: true,
        notice: "បានដំណើរការ Simulation (សូមភ្ជាប់ Telegram Bot Token ក្នុង Settings ដើម្បីបញ្ជូនទៅ Group ពិតប្រាកដ)",
      });
    }

    // If photo is attached AND not requested as pure text, send via /sendPhoto
    if (!sendAsText && photoBase64 && photoBase64.includes("base64,")) {
      try {
        const cleanBase64 = photoBase64.split(",")[1];
        const buffer = Buffer.from(cleanBase64, "base64");
        const blob = new Blob([buffer], { type: "image/jpeg" });

        // Build a clean, safe caption for the photo
        const photoCaption =
          message.length <= 800
            ? message
            : `📜 <b>ពាក្យសុំច្បាប់ផ្លូវការ V2 Education (Official Leave Form)</b>\n<i>(សូមពិនិត្យមើលរូបភាពលិខិតសុំច្បាប់ និងហត្ថលេខាសាមីខ្លួនខាងលើ 👆 និងព័ត៌មានលម្អិតក្នុងសារខាងក្រោម 👇)</i>`;
        const needsFollowupText = message.length > 800;

        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("photo", blob, "v2-leave-permission.jpg");
        formData.append("caption", photoCaption);
        formData.append("parse_mode", "HTML");

        let response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          body: formData,
        });

        let data = await response.json();

        // If entity parsing failed or caption rejected, retry immediately with plain text so photo is ALWAYS delivered!
        if (!data.ok) {
          console.warn("sendPhoto retry with plain text caption. Telegram error was:", data.description);
          const fallbackFormData = new FormData();
          fallbackFormData.append("chat_id", chatId);
          fallbackFormData.append("photo", blob, "v2-leave-permission.jpg");
          fallbackFormData.append("caption", "📜 ពាក្យសុំច្បាប់ផ្លូវការ V2 Education (Official Leave Form)");
          response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: "POST",
            body: fallbackFormData,
          });
          data = await response.json();
        }

        if (data.ok) {
          // Send full formatted text message right after the photo
          if (needsFollowupText) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
              }),
            });
          }
          return NextResponse.json({ success: true, isSimulated: false, result: data.result });
        } else {
          console.warn("sendPhoto error, attempting fallback to sendMessage:", data.description);
        }
      } catch (photoErr) {
        console.warn("Failed sending photo to Telegram, falling back to text:", photoErr);
      }
    }

    // Fallback or text-only: /sendMessage
    const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const data = await textRes.json();
    if (!textRes.ok || !data.ok) {
      return NextResponse.json(
        { success: false, error: data.description || "Failed to send message to Telegram" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, isSimulated: false, result: data.result });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Internal Telegram dispatch error";
    return NextResponse.json({ error: errMessage, success: false }, { status: 500 });
  }
}
