import { AttendanceType, PunctualityResult, Staff } from "@/types";

/**
 * Parse time string "HH:mm" into total minutes from start of day
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Format minutes into readable Khmer format (e.g. 15 -> "15 នាទី")
 */
export function formatMinutesKhmer(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} ម៉ោង ${m} នាទី` : `${h} ម៉ោង`;
  }
  return `${mins} នាទី`;
}

/**
 * Evaluate punctuality for staff check-in or check-out
 *
 * @param type 'CHECK_IN' | 'CHECK_OUT'
 * @param currentTimestamp Date or ISO string
 * @param staff Staff record with checkInTime and checkOutTime
 */
export function evaluatePunctuality(
  type: AttendanceType,
  currentTimestamp: Date | string,
  staff: Staff
): PunctualityResult {
  const date = typeof currentTimestamp === "string" ? new Date(currentTimestamp) : currentTimestamp;
  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMinutes;

  if (type === "CHECK_IN") {
    const shiftStartMins = timeToMinutes(staff.checkInTime);
    // Difference: positive means checked in early, negative means checked in late
    const diff = shiftStartMins - currentTotalMins;

    if (diff > 10) {
      // 🟢 មកលឿន / មកមុន (Early): Checked in > 10 minutes before shift time
      return {
        status: "EARLY",
        labelKhmer: "🟢 មកលឿន",
        diffMinutes: diff,
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        detailKhmer: `មកមុនម៉ោង ${formatMinutesKhmer(diff)} (វេនម៉ោង ${staff.checkInTime})`,
      };
    } else if (diff >= 0) {
      // 🔵 មកទាន់ម៉ោង (On-Time): Checked in between 10 minutes early and exactly on shift time
      return {
        status: "ON_TIME",
        labelKhmer: "🔵 ទាន់ម៉ោង",
        diffMinutes: Math.abs(diff),
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
        detailKhmer: `មកទាន់ម៉ោងល្អ (វេនម៉ោង ${staff.checkInTime})`,
      };
    } else {
      // 🔴 មកយឺត (Late): Checked in after shift time, specifying exact delay in minutes
      const lateMins = Math.abs(diff);
      return {
        status: "LATE",
        labelKhmer: `🔴 មកយឺត ${formatMinutesKhmer(lateMins)}`,
        diffMinutes: lateMins,
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        detailKhmer: `យឺត ${formatMinutesKhmer(lateMins)} (វេនម៉ោង ${staff.checkInTime})`,
      };
    }
  } else {
    // CHECK_OUT
    const shiftEndMins = timeToMinutes(staff.checkOutTime);
    const diff = shiftEndMins - currentTotalMins;

    if (diff > 0) {
      // 🟠 ចេញមុន (Early Leave): Checked out before departure shift time
      return {
        status: "EARLY_LEAVE",
        labelKhmer: `🟠 ចេញមុន ${formatMinutesKhmer(diff)}`,
        diffMinutes: diff,
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        detailKhmer: `ចេញមុនម៉ោងកំណត់ ${formatMinutesKhmer(diff)} (ម៉ោងចេញ ${staff.checkOutTime})`,
      };
    } else {
      // 🔵 ចេញធម្មតា
      return {
        status: "ON_TIME_LEAVE",
        labelKhmer: "🔵 ចេញធម្មតា",
        diffMinutes: 0,
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
        detailKhmer: `ចេញតាមម៉ោងកំណត់ (ម៉ោងចេញ ${staff.checkOutTime})`,
      };
    }
  }
}
