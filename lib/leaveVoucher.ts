import { LeaveRequest } from "@/types";
import { escapeHtml } from "@/lib/telegram";

/**
 * Format leave request into an official, comprehensive HTML caption
 * mirroring the official V2 Education Paper Leave Form for Telegram.
 */
export function formatTelegramLeaveMessage(leave: LeaveRequest): string {
  const isTeacher = leave.category === "TEACHER";
  const catLabel = isTeacher ? "👨‍🏫 គ្រូបង្រៀន" : "🏢 បុគ្គលិកទូទៅ";
  const deptSubjectLabel = isTeacher ? "📚 វិញ្ញាសា/មុខវិជ្ជា" : "💼 ផ្នែក/ដេប៉ាតឺម៉ង់";

  const aiAlert = leave.isQuotaExceeded
    ? "⚠️ <b>លើសកូតាច្បាប់កំណត់!</b> (កាត់ប្រាក់ខែតាមច្បាប់ការងារ)"
    : "✅ <b>ស្ថិតក្នុងកូតាច្បាប់ប្រចាំឆ្នាំ</b>";

  const safeStaffName = escapeHtml(leave.staffName);
  const safeStaffRole = escapeHtml(leave.staffRole);
  const safeBranchName = escapeHtml(leave.branchName);
  const safeBranchId = escapeHtml(leave.branchId);
  const safeSubjectOrDept = escapeHtml(leave.subjectOrDept || "ទូទៅ");
  const safeLeaveType = escapeHtml(leave.leaveType);
  const safeReason = escapeHtml(leave.reason);
  const safeSubstitute = leave.substituteStaff ? escapeHtml(leave.substituteStaff) : "";
  const safeClassGroup = leave.classGroupName ? escapeHtml(leave.classGroupName) : "";
  const safeClassShift = leave.classShiftTime ? escapeHtml(leave.classShiftTime) : "";
  const safeSig = escapeHtml(leave.applicantSignature || leave.staffName);

  const genderStr = leave.gender ? ` (${escapeHtml(leave.gender)})` : "";
  const resumeStr = leave.resumeDate ? `\n🔄 <b>ត្រឡប់មកបង្រៀន/ធ្វើការវិញ៖</b> <code>${escapeHtml(leave.resumeDate)}</code>` : "";
  const groupStr = safeClassGroup ? `\n👥 <b>ឈ្មោះក្រុម/ថ្នាក់៖</b> ${safeClassGroup}${safeClassShift ? ` (ម៉ោង ${safeClassShift})` : ""}` : "";
  const subStr = safeSubstitute ? `\n🤝 <b>អ្នកទទួលបន្ទុកជំនួស៖</b> ${safeSubstitute}` : "";
  const durationStr = leave.durationUnit === "HOURS"
    ? `<b>${leave.leaveHours} ម៉ោង</b> ${leave.fromTime && leave.toTime ? `(ម៉ោង ${escapeHtml(leave.fromTime)} ដល់ ${escapeHtml(leave.toTime)}) ` : ""}(សមមូល ${leave.totalDays} ថ្ងៃ)`
    : `<b>${leave.totalDays} ថ្ងៃ</b>`;

  return `📜 <b>ពាក្យសុំច្បាប់ផ្លូវការ (V2 Education Leave Form)</b>
🏫 <b>ផ្ទះគ្រូបង្រៀនគំរូ V2 Education (${safeBranchName})</b>
💡 <i>«ចាំ យល់ បកស្រាយបាន = ចេះប្រាកដ»</i>
━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>ខ្ញុំបាទ/នាងខ្ញុំ៖</b> <code>${safeStaffName}</code>${genderStr}
🏷️ <b>តួនាទី៖</b> ${safeStaffRole} (${catLabel})
${deptSubjectLabel}៖ <b>${safeSubjectOrDept}</b>
🏫 <b>សាខាប្រចាំការ៖</b> ${safeBranchName} (${safeBranchId})
⏰ <b>វេនការងារ៖</b> <b>${leave.shiftHours} ម៉ោង/ថ្ងៃ</b>
━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <b>កម្មវត្ថុ៖</b> ស្នើសុំឈប់សម្រាកចំនួន ${durationStr}
📅 <b>ចាប់ពីថ្ងៃ៖</b> <code>${escapeHtml(leave.startDate)}</code> ដល់ <code>${escapeHtml(leave.endDate)}</code>${resumeStr}${groupStr}
📌 <b>ប្រភេទច្បាប់៖</b> <b>${safeLeaveType}</b>
🏷️ <b>ការប្រើប្រាស់ AL៖</b> ${leave.useAL ? "🟢 <b>ប្រើប្រាស់ AL (កាត់កូតាច្បាប់)</b>" : "⚪ <b>អត់ប្រើ AL (មិនកាត់កូតា / Unpaid)</b>"}
📝 <b>មូលហេតុ៖</b> ${safeReason}${subStr}
━━━━━━━━━━━━━━━━━━━━━━━━
🤖 <b>AI បូកសរុបកូតាច្បាប់ (Leave Balance)៖</b>
• កូតាច្បាប់សរុប៖ <b>${leave.leaveQuotaTotal} ថ្ងៃ</b>
• ធ្លាប់ឈប់កន្លងមក៖ <b>${leave.leaveQuotaUsed} ថ្ងៃ</b>
• ស្នើសុំលើកនេះ៖ <b>${leave.totalDays} ថ្ងៃ (${leave.useAL ? "កាត់ AL" : "អត់កាត់ AL"})</b>
• សមតុល្យនៅសល់៖ <b>${leave.leaveQuotaRemaining} ថ្ងៃ</b>
• ការវិភាគ AI៖ ${aiAlert}
━━━━━━━━━━━━━━━━━━━━━━━━
✍️ <b>ហត្ថលេខាសាមីខ្លួន៖</b> <i>${safeSig}</i> ${leave.signatureDataUrl ? "(បានគូសហត្ថលេខាឌីជីថល ✅)" : ""}
🏢 <b>ជូនចំពោះ៖</b> គណៈគ្រប់គ្រង & គណនេយ្យករ V2 Education
⏰ <b>កាលបរិច្ឆេទស្នើ៖</b> ${escapeHtml(leave.formattedTime)} • ${escapeHtml(leave.formattedDate)}
🛡️ <b>ប្រព័ន្ធ៖</b> ផ្ទៀងផ្ទាត់ដោយ V2aAttendence`;
}

/**
 * Helper to safely load an image with timeout fallback
 */
function loadImageSafe(src: string, timeoutMs = 1500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    img.onload = () => {
      if (!done) {
        done = true;
        resolve(img);
      }
    };
    img.onerror = () => {
      if (!done) {
        done = true;
        resolve(null);
      }
    };
    img.src = src;
    setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, timeoutMs);
  });
}

let cachedV2bImg: HTMLImageElement | null = null;
let cachedStampImg: HTMLImageElement | null = null;
if (typeof window !== "undefined") {
  loadImageSafe("/v2b.png").then((img) => {
    if (img) cachedV2bImg = img;
  });
  loadImageSafe("/v2logoRedCircleSignaturehang.png").then((img) => {
    if (img) cachedStampImg = img;
  });
}

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
export function toKhmerDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => KHMER_DIGITS[parseInt(d, 10)]);
}

export function toAsciiDigits(str: string): string {
  return String(str).replace(/[០-៩]/g, (d) => String(KHMER_DIGITS.indexOf(d)));
}

const KHMER_MONTHS: Record<string, string> = {
  "01": "មករា", "1": "មករា",
  "02": "កុម្ភៈ", "2": "កុម្ភៈ",
  "03": "មីនា", "3": "មីនា",
  "04": "មេសា", "4": "មេសា",
  "05": "ឧសភា", "5": "ឧសភា",
  "06": "មិថុនា", "6": "មិថុនា",
  "07": "កក្កដា", "7": "កក្កដា",
  "08": "សីហា", "8": "សីហា",
  "09": "កញ្ញា", "9": "កញ្ញា",
  "10": "តុលា",
  "11": "វិច្ឆិកា",
  "12": "ធ្នូ",
};

export function parseKhmerDateComponents(dateStr?: string): { day: string; month: string; year: string } {
  if (!dateStr) {
    const now = new Date();
    return {
      day: toKhmerDigits(String(now.getDate()).padStart(2, "0")),
      month: KHMER_MONTHS[String(now.getMonth() + 1).padStart(2, "0")] || "...",
      year: toKhmerDigits(now.getFullYear()),
    };
  }

  // YYYY-MM-DD
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const asciiMonth = toAsciiDigits(parts[1]).padStart(2, "0");
        return {
          day: toKhmerDigits(toAsciiDigits(parts[2])),
          month: KHMER_MONTHS[asciiMonth] || parts[1],
          year: toKhmerDigits(toAsciiDigits(parts[0])),
        };
      } else {
        const asciiMonth = toAsciiDigits(parts[1]).padStart(2, "0");
        return {
          day: toKhmerDigits(toAsciiDigits(parts[0])),
          month: KHMER_MONTHS[asciiMonth] || parts[1],
          year: toKhmerDigits(toAsciiDigits(parts[2])),
        };
      }
    }
  }

  // DD/MM/YYYY
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const asciiMonth = toAsciiDigits(parts[1]).padStart(2, "0");
      return {
        day: toKhmerDigits(toAsciiDigits(parts[0])),
        month: KHMER_MONTHS[asciiMonth] || parts[1],
        year: toKhmerDigits(toAsciiDigits(parts[2])),
      };
    }
  }

  return { day: toKhmerDigits(toAsciiDigits(dateStr)), month: "...", year: "២០២៦" };
}

/**
 * Standalone safe roundRect helper supporting all browsers
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 8
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Generate a high-resolution Official Permission Form Image (A4 Paper Replica)
 * mirroring the official V2 Education Paper Form (as in media_1790344836612.png).
 * Integrates the authentic V2b logo, accounting quota box, approval seal,
 * and the staff's actual drawn digital signature.
 */
export async function generateLeaveVoucherBadge(leave: LeaveRequest): Promise<string> {
  if (typeof document === "undefined") return "";

  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const width = 960;
  const height = 1380;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Crisp White Official Paper Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Subtle Elegant Document Double Borders (as in media_1790344836612.png)
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Load Logo, Official Stamp, and Drawn Signature in parallel
  const [logoImg, stampImg, sigImg] = await Promise.all([
    cachedV2bImg ? Promise.resolve(cachedV2bImg) : loadImageSafe("/v2b.png"),
    cachedStampImg ? Promise.resolve(cachedStampImg) : loadImageSafe("/v2logoRedCircleSignaturehang.png"),
    leave.signatureDataUrl ? loadImageSafe(leave.signatureDataUrl) : Promise.resolve(null),
  ]);

  // 2. Top Letterhead Header
  if (logoImg && logoImg.naturalWidth > 0) {
    ctx.drawImage(logoImg, 55, 42, 175, 62);
  } else {
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 32px 'Battambang', sans-serif";
    ctx.fillText("√2", 60, 85);
  }

  ctx.fillStyle = "#475569";
  ctx.font = "italic 13px 'Kantumruy Pro', sans-serif";
  ctx.fillText("បដិវត្តន៍ការអប់រំ", 65, 124);

  // Right Side Letterhead Title
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 19px 'Battambang', sans-serif";
  ctx.fillText(`ផ្ទះគ្រូបង្រៀនគំរូ V2 Education (${leave.branchName})`, 280, 62);

  ctx.fillStyle = "#475569";
  ctx.font = "13px 'Kantumruy Pro', sans-serif";
  ctx.fillText("V2 Education Tutorial Learning Center", 280, 86);

  ctx.fillStyle = "#2563eb";
  ctx.font = "italic 13px 'Kantumruy Pro', sans-serif";
  ctx.fillText("«ចាំ យល់ បកស្រាយបាន = ចេះប្រាកដ»", 280, 108);

  // Divider Line
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(50, 142);
  ctx.lineTo(width - 50, 142);
  ctx.stroke();

  // 3. Document Title: ពាក្យសុំច្បាប់
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 30px 'Battambang', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ពាក្យសុំច្បាប់", width / 2, 192);

  const titleW = ctx.measureText("ពាក្យសុំច្បាប់").width;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - titleW / 2 - 14, 202);
  ctx.lineTo(width / 2 + titleW / 2 + 14, 202);
  ctx.moveTo(width / 2 - titleW / 2 - 14, 206);
  ctx.lineTo(width / 2 + titleW / 2 + 14, 206);
  ctx.stroke();
  ctx.textAlign = "left";

  // 4. Section 1: Applicant Information
  const textX = 65;
  ctx.font = "16px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(
    `ខ្ញុំបាទ/នាងខ្ញុំឈ្មោះ៖ ${leave.staffName}      ភេទ៖ ${leave.gender || "---"}      តួនាទី៖ ${leave.staffRole}      វិញ្ញាសា៖ ${leave.subjectOrDept || "ទូទៅ"}`,
    textX,
    262
  );
  ctx.fillText(`នៅផ្ទះគ្រូបង្រៀនគំរូ V2 Education (${leave.branchName}) ។`, textX, 296);

  // 5. Salutation: Addressed to Management
  ctx.textAlign = "center";
  ctx.font = "bold 17px 'Battambang', sans-serif";
  ctx.fillStyle = "#1e3a8a";
  ctx.fillText("សូមគោរពជូនចំពោះ", width / 2, 348);
  ctx.font = "bold 18px 'Battambang', sans-serif";
  ctx.fillText("គណៈគ្រប់គ្រង សោម នារី", width / 2, 376);
  ctx.font = "bold 16px 'Battambang', sans-serif";
  ctx.fillText("នៃផ្ទះបង្រៀនគំរូ V2 Education", width / 2, 404);
  ctx.textAlign = "left";

  // Parse Khmer Date Components for Authentic Cambodian Document Display
  const startComp = parseKhmerDateComponents(leave.startDate);
  const endComp = parseKhmerDateComponents(leave.endDate);
  const resumeComp = parseKhmerDateComponents(leave.resumeDate || leave.endDate);

  // 6. Section 2: Leave Request Details
  ctx.font = "16px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#0f172a";

  const durationStr =
    leave.durationUnit === "HOURS"
      ? `${toKhmerDigits(leave.leaveHours || 1)} ម៉ោង`
      : `${toKhmerDigits(leave.totalDays)} ថ្ងៃ`;

  const dateSpanText =
    leave.durationUnit === "HOURS" || leave.startDate === leave.endDate
      ? `ពីថ្ងៃទី ${startComp.day} ខែ ${startComp.month} ឆ្នាំ ${startComp.year}`
      : `ពីថ្ងៃទី ${startComp.day} ខែ ${startComp.month} ឆ្នាំ ${startComp.year} ដល់ថ្ងៃទី ${endComp.day} ខែ ${endComp.month} ឆ្នាំ ${endComp.year}`;

  ctx.fillText(
    `កម្មវត្ថុ ៖ ស្នើសុំឈប់សម្រាកចំនួន ${durationStr} ${dateSpanText}`,
    textX,
    455
  );

  // Group 1 line
  const group1Str = leave.classGroupName || "....................................";
  const shiftTime1 = leave.classShiftTime || (leave.durationUnit === "HOURS" && leave.fromTime && leave.toTime ? `${leave.fromTime} - ${leave.toTime}` : "................");
  ctx.fillText(
    `ឈ្មោះក្រុម ៖ ${group1Str}      ម៉ោងចូល-ម៉ោងចេញ ៖ ${shiftTime1}`,
    textX,
    489
  );

  // Group 2 line
  const group2Str = leave.classGroupName2 || (leave.classGroupName ? "" : "....................................");
  const shiftTime2 = leave.classShiftTime2 || (leave.classGroupName ? "" : "................");
  if (group2Str || !leave.classGroupName) {
    ctx.fillText(
      `ឈ្មោះក្រុម ៖ ${group2Str || "...................................."}      ម៉ោងចូល-ម៉ោងចេញ ៖ ${shiftTime2 || "................"}`,
      textX,
      521
    );
  }

  const returnY = (group2Str || !leave.classGroupName) ? 555 : 523;
  ctx.fillText(
    `នឹងត្រឡប់មក បង្រៀន/បំពេញការងារ ធម្មតាវិញនៅថ្ងៃទី ${resumeComp.day} ខែ ${resumeComp.month} ឆ្នាំ ${resumeComp.year} ។`,
    textX,
    returnY
  );

  const reasonY = returnY + 34;
  ctx.fillText(`មូលហេតុ ៖ ${leave.reason || "......................................................................................."} ។`, textX, reasonY);

  if (leave.substituteStaff) {
    ctx.fillText(`អ្នកទទួលបន្ទុកជំនួស ៖ ${leave.substituteStaff} ។`, textX, reasonY + 30);
  }

  // 7. Section 3: Official AL & Quota Summary Box
  const boxY = leave.substituteStaff ? reasonY + 68 : reasonY + 44;
  const boxH = 115;
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  drawRoundRect(ctx, textX, boxY, width - textX * 2, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 13px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#1e3a8a";
  ctx.fillText("📋 ព័ត៌មានកូតាច្បាប់ & គណនេយ្យ (LEAVE QUOTA & ACCOUNTING):", textX + 16, boxY + 26);

  ctx.font = "14px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(
    `• ប្រភេទច្បាប់៖ ${leave.leaveType}    |    ការប្រើប្រាស់ AL៖ ${
      leave.useAL ? "🟢 ប្រើប្រាស់ AL (កាត់កូតាច្បាប់)" : "⚪ អត់ប្រើ AL (មិនកាត់កូតា/Unpaid)"
    }`,
    textX + 16,
    boxY + 54
  );

  ctx.fillText(
    `• សមតុល្យច្បាប់ AL៖ កូតាសរុប ${leave.leaveQuotaTotal} ថ្ងៃ  |  ធ្លាប់ឈប់ ${leave.leaveQuotaUsed} ថ្ងៃ  |  ស្នើលើកនេះ ${leave.totalDays} ថ្ងៃ  |  នៅសល់ ${leave.leaveQuotaRemaining} ថ្ងៃ`,
    textX + 16,
    boxY + 80
  );

  ctx.font = "13px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = leave.isQuotaExceeded ? "#dc2626" : "#059669";
  ctx.fillText(
    `• ការវិភាគ AI៖ ${leave.isQuotaExceeded ? "⚠️ ស្នើសុំលើសកូតា AL កំណត់" : "✅ ត្រឹមត្រូវតាមលក្ខខណ្ឌច្បាប់ការងារ"}`,
    textX + 16,
    boxY + 104
  );

  // 8. Formal Closing Courtesy Text
  const closeY = boxY + boxH + 34;
  ctx.font = "14px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText(
    "អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូមគណៈគ្រប់គ្រងនៃផ្ទះគ្រូបង្រៀនគំរូ V2 Education មេត្តាអនុញ្ញាតដោយសេចក្តីអនុគ្រោះនិងយោគយល់ ។",
    textX,
    closeY
  );
  ctx.fillText(
    "សូមគណៈគ្រប់គ្រងនៃផ្ទះបង្រៀនគំរូ V2 Education មេត្តាទទួលនូវការគោរពដ៏ខ្ពង់ខ្ពស់ អំពីខ្ញុំបាទ/នាងខ្ញុំ ។",
    textX,
    closeY + 26
  );

  // 9. Signatures Block
  const sigSectionY = closeY + 65;

  // Left Column: Management / Stamp
  const leftCenterX = 230;
  ctx.textAlign = "center";
  ctx.font = "bold 16px 'Battambang', sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText("បានឃើញ និងឯកភាព", leftCenterX, sigSectionY);

  ctx.font = "bold 13px 'Battambang', sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("អ្នកទទួលពាក្យ និង អ្នកឯកភាព", leftCenterX, sigSectionY + 24);

  // Render the official stamp (v2logoRedCircleSignaturehang)
  if (stampImg && stampImg.naturalWidth > 0) {
    const stampW = 210;
    const stampH = Math.round(stampW / 1.61); // ~130px
    ctx.drawImage(stampImg, leftCenterX - stampW / 2, sigSectionY + 34, stampW, stampH);
  } else {
    // Approval Stamp Seal fallback
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, leftCenterX - 100, sigSectionY + 36, 200, 85, 8);
    ctx.stroke();

    ctx.fillStyle = "#b91c1c";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("V2 EDUCATION MANAGEMENT", leftCenterX, sigSectionY + 65);
    ctx.font = "bold 13px 'Battambang', sans-serif";
    ctx.fillText("✅ ជំនួយការស្ថាបនិក ហាក់ សេងហាំង", leftCenterX, sigSectionY + 95);
  }

  // Right Column: Applicant Signature & Date
  const rightCenterX = width - 260;
  ctx.textAlign = "center";
  ctx.font = "14px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#334155";
  const todayComp = parseKhmerDateComponents(leave.formattedDate || new Date().toISOString().split("T")[0]);
  ctx.fillText(`ភ្នំពេញ ថ្ងៃទី ${todayComp.day} ខែ ${todayComp.month} ឆ្នាំ ${todayComp.year}`, rightCenterX, sigSectionY);

  ctx.font = "bold 16px 'Battambang', sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText("ហត្ថលេខាសាមីខ្លួន", rightCenterX, sigSectionY + 24);

  // Render the staff's actual drawn digital signature
  if (sigImg && sigImg.naturalWidth > 0) {
    ctx.drawImage(sigImg, rightCenterX - 95, sigSectionY + 34, 190, 85);
  } else {
    // Stylized signature fallback
    ctx.font = "italic bold 22px 'Battambang', cursive";
    ctx.fillStyle = "#1e3a8a";
    ctx.fillText(leave.applicantSignature || leave.staffName, rightCenterX, sigSectionY + 80);
  }

  // Printed Name underneath
  ctx.font = "bold 15px 'Battambang', sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(`(${leave.applicantSignature || leave.staffName})`, rightCenterX, sigSectionY + 138);

  // 10. Official Document Footer
  ctx.font = "11px 'Kantumruy Pro', sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(
    "លិខិតសុំច្បាប់ផ្លូវការ V2 Education — បង្កើត និងផ្ទៀងផ្ទាត់ដោយប្រព័ន្ធ V2aAttendence",
    width / 2,
    height - 38
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}
