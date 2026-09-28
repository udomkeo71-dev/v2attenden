import { AttendanceRecord, Staff } from "@/types";

/**
 * Format attendance record into the exact required Telegram HTML caption
 */
export function formatTelegramAttendanceMessage(record: AttendanceRecord): string {
  const isCheckIn = record.type === "CHECK_IN";
  const typeBadge = isCheckIn
    ? "🟢 <b>ចូលបម្រើការងារ (CHECK-IN)</b>"
    : "🟠 <b>ចេញពីការងារ (CHECK-OUT)</b>";

  const mapsUrl = `https://maps.google.com/?q=${record.userCoords.latitude.toFixed(6)},${record.userCoords.longitude.toFixed(6)}`;
  const gpsPill = record.geofence.isWithinGeofence
    ? `✅ ក្នុងបរិវេណ (${record.geofence.distanceMeters}m)`
    : `⚠️ ក្រៅបរិវេណ (${record.geofence.distanceMeters}m)`;

  return `✨ <b>V2aAttendence — របាយការណ៍វត្តមានផ្លូវការ</b>

${typeBadge}
🏫 <b>បញ្ជាក់សាខាស្កេន៖</b> <b>${record.branchName} (${record.branchId})</b>
👤 <b>បុគ្គលិក៖</b> <code>${record.staffName}</code>
💼 <b>តួនាទី៖</b> ${record.staffRole}
⏰ <b>ពេលវេលា៖</b> <code>${record.formattedTime}</code> • ${record.formattedDate}
🚦 <b>ស្ថានភាពម៉ោង៖</b> <b>${record.punctuality.labelKhmer}</b>
📍 <b>ទីតាំង GPS៖</b> ${gpsPill} (កាំកំណត់ត្រឹម ១០០ ម៉ែត្រ)
🗺️ <b>ផែនទីជាក់ស្តែង៖</b> <a href="${mapsUrl}">📍 ចុចមើលលើ Google Maps</a>
🛡️ <b>ប្រព័ន្ធ៖</b> ស្កេនកូដ QR សាខាផ្លូវការ V2 Education`;
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

  // Filter records for today's date
  const todayRecords = records.filter(
    (r) =>
      r.formattedDate === dateStr ||
      new Date(r.timestamp).toLocaleDateString("en-GB") === dateStr ||
      r.timestamp.startsWith(new Date().toISOString().split("T")[0])
  );

  // Group by staffId
  const staffMap: Record<
    string,
    {
      staff: Staff;
      checkIn?: AttendanceRecord;
      checkOut?: AttendanceRecord;
    }
  > = {};

  staffList.forEach((s) => {
    staffMap[s.id] = { staff: s };
  });

  todayRecords.forEach((r) => {
    if (!staffMap[r.staffId]) {
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
    if (r.type === "CHECK_IN") {
      if (!staffMap[r.staffId].checkIn || new Date(r.timestamp) < new Date(staffMap[r.staffId].checkIn!.timestamp)) {
        staffMap[r.staffId].checkIn = r;
      }
    } else if (r.type === "CHECK_OUT") {
      if (!staffMap[r.staffId].checkOut || new Date(r.timestamp) > new Date(staffMap[r.staffId].checkOut!.timestamp)) {
        staffMap[r.staffId].checkOut = r;
      }
    }
  });

  const staffItems = Object.values(staffMap);
  const presentItems = staffItems.filter((i) => i.checkIn || i.checkOut);
  const totalStaff = staffList.length;
  const presentCount = presentItems.length;
  const onTimeCount = presentItems.filter(
    (i) => i.checkIn && (i.checkIn.punctuality.status === "ON_TIME" || i.checkIn.punctuality.status === "EARLY")
  ).length;
  const lateCount = presentItems.filter(
    (i) => i.checkIn && i.checkIn.punctuality.status === "LATE"
  ).length;
  const checkedOutCount = presentItems.filter((i) => i.checkOut).length;
  const absentCount = totalStaff - presentCount;

  const headerBranch = branchNameFilter ? `សាខា៖ ${branchNameFilter}` : "គ្រប់សាខាទាំងអស់ (៧ សាខា)";

  let msg = `📊 <b>របាយការណ៍វត្តមានប្រចាំថ្ងៃ (សម្រាប់គណនេយ្យ)</b>\n`;
  msg += `🏫 <b>ស្ថាប័ន៖</b> V2 Education Group\n`;
  msg += `🏢 <b>${headerBranch}</b>\n`;
  msg += `📅 <b>កាលបរិច្ឆេទ៖</b> ${dateStr} | ⏰ <b>របាយការណ៍ម៉ោង ៩:០០ យប់</b>\n`;
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

  // Sort: Present staff first, then by branch
  staffItems.sort((a, b) => {
    if ((a.checkIn || a.checkOut) && !b.checkIn && !b.checkOut) return -1;
    if (!a.checkIn && !a.checkOut && (b.checkIn || b.checkOut)) return 1;
    return a.staff.name.localeCompare(b.staff.name);
  });

  staffItems.forEach((item, index) => {
    const s = item.staff;
    const inRec = item.checkIn;
    const outRec = item.checkOut;
    const hasAttended = Boolean(inRec || outRec);

    msg += `<b>${index + 1}. ${s.name}</b> (${s.role || "បុគ្គលិក"}) — <i>${s.branchId}</i>\n`;

    if (hasAttended) {
      const inTime = inRec ? inRec.formattedTime : "❌ គ្មានស្កេនចូល";
      const inStatus = inRec ? inRec.punctuality.labelKhmer : "";
      const outTime = outRec ? outRec.formattedTime : "⏳ មិនទាន់ស្កេនចេញ";
      const outStatus = outRec ? outRec.punctuality.labelKhmer : "";

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
