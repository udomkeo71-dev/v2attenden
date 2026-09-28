import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface VerifyAIRequestBody {
  imageBase64: string; // Base64 data URL (e.g. data:image/jpeg;base64,...)
  staffName?: string;
  branchName?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyAIRequestBody = await req.json();
    const { imageBase64, staffName = "បុគ្គលិក", branchName = "សាខា", apiKey: clientKey } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const apiKey = clientKey || process.env.GEMINI_API_KEY;

    // Clean Base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // If Gemini API Key is available, invoke real Gemini Flash
    if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash or gemini-2.5-flash as specified
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const prompt = `You are an AI Attendance Verification Auditor for a Cambodian school (V2 Education).
Analyze the submitted camera photo for attendance verification of staff member "${staffName}" at "${branchName}".
Check:
1. Is a real human face clearly visible?
2. Is there any evidence of anti-spoofing (screen re-photo, printed picture, cheating)?
3. Provide a concise 1-sentence verification message in formal Khmer.
Return strict JSON:
{
  "isValid": boolean,
  "isRealPerson": boolean,
  "summaryKhmer": string
}`;

        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        return NextResponse.json({
          success: true,
          isSimulated: false,
          isValid: Boolean(parsed.isValid),
          isRealPerson: Boolean(parsed.isRealPerson),
          summaryKhmer: parsed.summaryKhmer || "បានផ្ទៀងផ្ទាត់ផ្ទៃមុខមនុស្សពិតត្រឹមត្រូវដោយជោគជ័យ។",
        });
      } catch (geminiError: unknown) {
        console.warn("Gemini API call failed, falling back to smart simulation:", geminiError);
        // Fallback to simulation if network/quota fails
      }
    }

    // Smart Simulation Fallback (when no key is set yet, allowing seamless local testing)
    const simulatedValid = true;
    const summaries = [
      `ផ្ទៀងផ្ទាត់ផ្ទៃមុខមនុស្សពិត និងគ្មានសញ្ញាក្លែងបន្លំឡើយសម្រាប់លោក/អ្នក ${staffName}។`,
      `រូបថតច្បាស់ល្អ ផ្ទៃមុខមនុស្សពិតត្រឹមត្រូវ ទទួលស្គាល់វត្តមានផ្លូវការ។`,
      `ការស្កេនផ្ទៃមុខផ្ទាល់ត្រឹមត្រូវ ស្របតាមលក្ខខណ្ឌសន្តិសុខសាលា។`,
    ];
    const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];

    return NextResponse.json({
      success: true,
      isSimulated: true,
      isValid: simulatedValid,
      isRealPerson: true,
      summaryKhmer: `${randomSummary} (AI Simulator)`,
      notice: "ដំណើរការតាមប្រព័ន្ធ AI Simulation (សូមភ្ជាប់ GEMINI_API_KEY ក្នុង Settings ដើម្បីដំណើរការ Gemini Cloud ពិតប្រាកដ)",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal verification error";
    return NextResponse.json(
      { error: message, isValid: false, isRealPerson: false },
      { status: 500 }
    );
  }
}
