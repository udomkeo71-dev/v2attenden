import { AttendanceRecord, Staff } from "@/types";

/**
 * Escape HTML special characters for safe Telegram HTML parse_mode
 */
export function escapeHtml(text: string = ""): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Format standard branch name matching V2 Education CheckinMeBot standard
 */
export function getStandardBranchReportName(branchId: string = "", branchNameKhmer?: string): string {
  const cleanId = (branchId || "").toUpperCase();
  if (cleanId === "OLP" || cleanId === "PSL") return "V2 Education Olympic";
  if (cleanId === "TTP") return "V2 Education TTP";
  if (cleanId === "TK") return "V2 Education TK 4.1";
  if (cleanId === "BKK") return "V2 Education BKK";
  if (cleanId === "STM") return "V2 Education Santhormok";
  if (cleanId === "BS" || cleanId === "CA") return "V2 Education Boeung Snor";
  if (cleanId === "SS" || cleanId === "SR") return "V2 Education Sen Sok";

  if (branchNameKhmer) {
    if (branchNameKhmer.includes("អូឡាំពិក")) return "V2 Education Olympic";
    if (branchNameKhmer.includes("ទួលទំពូង")) return "V2 Education TTP";
    if (branchNameKhmer.includes("ទួលគោក")) return "V2 Education TK 4.1";
    if (branchNameKhmer.includes("បឹងកេងកង")) return "V2 Education BKK";
    if (branchNameKhmer.includes("សន្ធរម៉ុក")) return "V2 Education Santhormok";
    if (branchNameKhmer.includes("បឹងស្នោ") || branchNameKhmer.includes("ច្បារអំពៅ")) return "V2 Education Boeung Snor";
    if (branchNameKhmer.includes("សែនសុខ")) return "V2 Education Sen Sok";
  }
  return `V2 Education ${branchId}`;
}

/**
 * Format position: Position: Teacher Math(Mathematics) or Accountant(Finance) or Admin(HR)
 */
export function getStandardPositionReport(role: string = "", subjectOrDept?: string): string {
  if (!role) return subjectOrDept || "Staff";
  if (role.includes("(") && role.includes(")")) {
    return role;
  }
  if (subjectOrDept) {
    return `${role}(${subjectOrDept})`;
  }
  return role;
}

/**
 * Format status string:
 * - 🟢 Early 55m / 🟢 Early 1h 20m
 * - 🔵 Good
 * - 🔴 Late 15m / 🔴 Late 1h 10m
 * - 🔴 Early 6h 59m
 */
export function getStandardStatusBadge(
  type: "CHECK_IN" | "CHECK_OUT",
  punctualityStatus: string = "ON_TIME",
  diffMinutes: number = 0
): string {
  const formatHmM = (mins: number) => {
    const absMins = Math.abs(mins);
    if (absMins >= 60) {
      const h = Math.floor(absMins / 60);
      const m = absMins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${absMins}m`;
  };

  if (type === "CHECK_IN") {
    if (punctualityStatus === "EARLY" && diffMinutes > 0) {
      return `🟢 Early ${formatHmM(diffMinutes)}`;
    } else if (punctualityStatus === "LATE" && diffMinutes > 0) {
      return `🔴 Late ${formatHmM(diffMinutes)}`;
    } else {
      return `🔵 Good`;
    }
  } else {
    // CHECK_OUT
    if (punctualityStatus === "EARLY_LEAVE" && diffMinutes > 0) {
      return `🔴 Early ${formatHmM(diffMinutes)}`;
    } else {
      return `🔵 Good`;
    }
  }
}

/**
 * EXACT OFFICIAL CHECKINME FORMAT (from user photo media_1790662177456.png):
 *
 * Cheng Sophanny checked in 🟢 Early 55m
 * Position: Teacher Chemistry(Chemistry)
 * Branch: V2 Education Olympic
 * Reason: ... (if checkout reason provided)
 */
export function formatTelegramAttendanceMessage(
  record: AttendanceRecord,
  staffSubjectOrDept?: string,
  reason?: string
): string {
  const isCheckIn = record.type === "CHECK_IN";
  const actionWord = isCheckIn ? "checked in" : "checked out";
  const statusBadge = getStandardStatusBadge(
    record.type,
    record.punctuality?.status || "ON_TIME",
    record.punctuality?.diffMinutes || 0
  );

  const position = getStandardPositionReport(record.staffRole, staffSubjectOrDept);
  const branchName = getStandardBranchReportName(record.branchId, record.branchName);

  let msg = `<b>${escapeHtml(record.staffName)}</b> ${actionWord} ${statusBadge}\n` +
            `Position: ${escapeHtml(position)}\n` +
            `Branch: ${escapeHtml(branchName)}`;

  if (reason && reason.trim()) {
    msg += `\nReason: ${escapeHtml(reason.trim())}`;
  }

  return msg;
}

/**
 * Format daily attendance accounting report sent at 9:00 PM for the accounting department
 */
export function formatDailyAccountingTelegramReport(params: {
  dateStr: string;
  records: AttendanceRecord[];
  staffList: Staff[];
  branchNameFilter?: string;
}): string {
  const { dateStr, records, staffList, branchNameFilter } = params;

  // Filter staff by branch if filter is provided and not "ALL"
  const isBranchFiltered = Boolean(branchNameFilter && branchNameFilter !== "ALL");
  const filteredStaffList = isBranchFiltered
    ? staffList.filter(
        (s) =>
          s.branchId.toUpperCase() === branchNameFilter!.toUpperCase() ||
          s.branchId === branchNameFilter
      )
    : staffList;

  // Filter records strictly matching target date and branch filter
  const targetRecords = records.filter((r) => {
    let matchDate = r.formattedDate === dateStr;
    if (!matchDate) {
      try {
        matchDate = new Date(r.timestamp).toLocaleDateString("en-GB") === dateStr;
      } catch {
        matchDate = false;
      }
    }
    if (!matchDate) return false;

    if (isBranchFiltered) {
      return (
        r.branchId.toUpperCase() === branchNameFilter!.toUpperCase() ||
        r.branchId === branchNameFilter ||
        r.branchName.includes(branchNameFilter!)
      );
    }
    return true;
  });

  // Group by staffId
  const staffMap: Record<
    string,
    {
      staff: Staff;
      checkIn?: AttendanceRecord;
      checkOut?: AttendanceRecord;
    }
  > = {};

  filteredStaffList.forEach((s) => {
    staffMap[s.id] = { staff: s };
  });

  targetRecords.forEach((r) => {
    if (!staffMap[r.staffId]) {
      // If staff belongs to target branch or no branch filter
      if (
        !isBranchFiltered ||
        r.branchId.toUpperCase() === branchNameFilter!.toUpperCase() ||
        r.branchId === branchNameFilter
      ) {
        staffMap[r.staffId] = {
          staff: {
            id: r.staffId,
            name: r.staffName,
            role: r.staffRole,
            branchId: r.branchId,
            category: "STAFF",
            phone: "",
            checkInTime: "07:30",
            checkOutTime: "17:00",
          },
        };
      }
    }
    if (staffMap[r.staffId]) {
      if (r.type === "CHECK_IN") {
        if (!staffMap[r.staffId].checkIn || new Date(r.timestamp) < new Date(staffMap[r.staffId].checkIn!.timestamp)) {
          staffMap[r.staffId].checkIn = r;
        }
      } else if (r.type === "CHECK_OUT") {
        if (!staffMap[r.staffId].checkOut || new Date(r.timestamp) > new Date(staffMap[r.staffId].checkOut!.timestamp)) {
          staffMap[r.staffId].checkOut = r;
        }
      }
    }
  });

  const staffItems = Object.values(staffMap);
  const presentItems = staffItems.filter((i) => i.checkIn || i.checkOut);
  const totalStaff = filteredStaffList.length;
  const presentCount = presentItems.length;
  const onTimeCount = presentItems.filter(
    (i) => i.checkIn && (i.checkIn.punctuality.status === "ON_TIME" || i.checkIn.punctuality.status === "EARLY")
  ).length;
  const lateCount = presentItems.filter(
    (i) => i.checkIn && i.checkIn.punctuality.status === "LATE"
  ).length;
  const checkedOutCount = presentItems.filter((i) => i.checkOut).length;
  const absentCount = Math.max(0, totalStaff - presentCount);

  const headerBranch = isBranchFiltered
    ? `សាខា៖ ${escapeHtml(branchNameFilter)}`
    : "គ្រប់សាខាទាំងអស់ (៧ សាខា)";

  let msg = `📊 <b>របាយការណ៍វត្តមានប្រចាំថ្ងៃ (សម្រាប់គណនេយ្យ)</b>\n`;
  msg += `🏫 <b>ស្ថាប័ន៖</b> V2 Education Group\n`;
  msg += `🏢 <b>${headerBranch}</b>\n`;
  msg += `📅 <b>កាលបរិច្ឆេទ៖</b> ${escapeHtml(dateStr)} | ⏰ <b>របាយការណ៍ម៉ោង ៩:០០ យប់</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📈 <b>សង្ខេបស្ថិតិប្រចាំថ្ងៃ៖</b>\n`;
  msg += `• ចំនួនបុគ្គលិកសរុប៖ <b>${totalStaff}</b> នាក់\n`;
  msg += `• វត្តមានមកធ្វើការ៖ <b>${presentCount}</b> នាក់\n`;
  msg += `• ចូលទាន់ម៉ោង៖ <b>${onTimeCount}</b> នាក់\n`;
  msg += `• ចូលយឺត៖ <b>${lateCount}</b> នាក់\n`;
  msg += `• អវត្តមាន (មិនបានស្កេន)៖ <b>${absentCount}</b> នាក់\n`;
  msg += `• ស្កេនចេញរួចរាល់៖ <b>${checkedOutCount} / ${presentCount}</b> នាក់\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 <b>បញ្ជីវត្តមានចេញ-ចូល លម្អិត៖</b>\n\n`;

  // Sort: Present staff first, then by name
  staffItems.sort((a, b) => {
    if ((a.checkIn || a.checkOut) && !b.checkIn && !b.checkOut) return -1;
    if (!a.checkIn && !a.checkOut && (b.checkIn || b.checkOut)) return 1;
    return a.staff.name.localeCompare(b.staff.name, "km");
  });

  staffItems.forEach((item, index) => {
    const s = item.staff;
    const inRec = item.checkIn;
    const outRec = item.checkOut;
    const hasAttended = Boolean(inRec || outRec);

    const safeName = escapeHtml(s.name);
    const safeRole = escapeHtml(s.role || "បុគ្គលិក");
    const safeBranch = escapeHtml(s.branchId);

    msg += `<b>${index + 1}. ${safeName}</b> (${safeRole}) — <i>${safeBranch}</i>\n`;

    if (hasAttended) {
      const inTime = inRec ? escapeHtml(inRec.formattedTime) : "❌ គ្មានស្កេនចូល";
      const inStatus = inRec ? escapeHtml(inRec.punctuality.labelKhmer) : "";
      const outTime = outRec ? escapeHtml(outRec.formattedTime) : "⏳ មិនទាន់ស្កេនចេញ";
      const outStatus = outRec ? escapeHtml(outRec.punctuality.labelKhmer) : "";

      // Calculate work duration if both present
      let durationStr = "";
      if (inRec && outRec) {
        const diffMs = new Date(outRec.timestamp).getTime() - new Date(inRec.timestamp).getTime();
        const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(1);
        durationStr = ` • ⏱️ <b>${diffHours} ម៉ោង</b>`;
      }

      msg += `   🟢 ចូល៖ <code>${inTime}</code> ${inStatus}\n`;
      msg += `   🟠 ចេញ៖ <code>${outTime}</code> ${outStatus}${durationStr}\n`;
      msg += `   📍 ផ្ទៀងផ្ទាត់ GPS៖ ✅ ក្នុងបរិវេណសាខា (≤ 100m)\n\n`;
    } else {
      msg += `   ⚪ <b>អវត្តមាន / មិនបានស្កេនវត្តមាន</b>\n\n`;
    }
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💼 <i>របាយការណ៍នេះសម្រាប់ផ្នែកគណនេយ្យទូទាត់ប្រាក់ខែ និងស្រង់ទិន្នន័យផ្លូវការ។</i>\n`;
  msg += `🛡️ <i>កត់ត្រា និងផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្តិតាមរយៈ V2aAttendence System</i>`;

  return msg;
}
