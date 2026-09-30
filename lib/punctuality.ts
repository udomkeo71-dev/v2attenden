// lib/punctuality.ts - Punctuality evaluation with multi-shift & day-of-week support

import { AttendanceType, DayShiftSchedule, PunctualityResult, Staff } from "@/types";

/**
 * Parse time string "HH:mm" into total minutes from start of day
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
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
 * Dynamically get the active staff shift for today and current time
 * Takes into account:
 * - Day of week (Mon-Fri, Sat, Sun)
 * - Two shifts per day (Shift 1 vs Shift 2 switch point)
 */
export function getActiveStaffShift(
  staff: Staff,
  currentTimestamp: Date | string = new Date()
): {
  checkInTime: string;
  checkOutTime: string;
  shiftLabel: string;
  dayLabel: string;
} {
  const date = typeof currentTimestamp === "string" ? new Date(currentTimestamp) : currentTimestamp;
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentTotalMins = date.getHours() * 60 + date.getMinutes();

  if (!staff.schedule) {
    return {
      checkInTime: staff.checkInTime || "07:30",
      checkOutTime: staff.checkOutTime || "17:00",
      shiftLabel: "វេនទូទៅ",
      dayLabel: "ចន្ទ - សុក្រ",
    };
  }

  let dayConfig: DayShiftSchedule;
  let dayLabel: string;
  if (day === 0) {
    dayConfig = staff.schedule.sun;
    dayLabel = "អាទិត្យ";
  } else if (day === 6) {
    dayConfig = staff.schedule.sat;
    dayLabel = "សៅរ៍";
  } else {
    dayConfig = staff.schedule.monFri;
    dayLabel = "ចន្ទ - សុក្រ";
  }

  if (!dayConfig || !dayConfig.enabled) {
    return {
      checkInTime: staff.checkInTime || "07:30",
      checkOutTime: staff.checkOutTime || "17:00",
      shiftLabel: "វេនក្រៅកាលវិភាគ",
      dayLabel,
    };
  }

  if (dayConfig.hasTwoShifts && dayConfig.shift2 && dayConfig.shift2.enabled) {
    const shift1OutMins = timeToMinutes(dayConfig.shift1.checkOut);
    const shift2InMins = timeToMinutes(dayConfig.shift2.checkIn);
    // Switchover point between morning shift and afternoon shift
    const switchPoint = (shift1OutMins + shift2InMins) / 2;

    if (currentTotalMins >= switchPoint) {
      return {
        checkInTime: dayConfig.shift2.checkIn,
        checkOutTime: dayConfig.shift2.checkOut,
        shiftLabel: "វេនទី ២ (រសៀល/យប់)",
        dayLabel,
      };
    } else {
      return {
        checkInTime: dayConfig.shift1.checkIn,
        checkOutTime: dayConfig.shift1.checkOut,
        shiftLabel: "វេនទី ១ (ព្រឹក)",
        dayLabel,
      };
    }
  }

  return {
    checkInTime: dayConfig.shift1.checkIn || staff.checkInTime || "07:30",
    checkOutTime: dayConfig.shift1.checkOut || staff.checkOutTime || "17:00",
    shiftLabel: "វេនទី ១",
    dayLabel,
  };
}

/**
 * Evaluate punctuality for staff check-in or check-out
 * Supports 2-shift schedules and day-of-week timing
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

  const activeShift = getActiveStaffShift(staff, date);
  const targetCheckIn = activeShift.checkInTime;
  const targetCheckOut = activeShift.checkOutTime;

  if (type === "CHECK_IN") {
    const shiftStartMins = timeToMinutes(targetCheckIn);
    const diff = shiftStartMins - currentTotalMins;

    if (diff > 10) {
      return {
        status: "EARLY",
        labelKhmer: "🟢 មកលឿន",
        diffMinutes: diff,
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        detailKhmer: `មកមុនម៉ោង ${formatMinutesKhmer(diff)} (${activeShift.shiftLabel} ម៉ោង ${targetCheckIn})`,
        shiftName: activeShift.shiftLabel,
        dayName: activeShift.dayLabel,
      };
    } else if (diff >= 0) {
      return {
        status: "ON_TIME",
        labelKhmer: "🔵 ទាន់ម៉ោង",
        diffMinutes: Math.abs(diff),
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
        detailKhmer: `មកទាន់ម៉ោងល្អ (${activeShift.shiftLabel} ម៉ោង ${targetCheckIn})`,
        shiftName: activeShift.shiftLabel,
        dayName: activeShift.dayLabel,
      };
    } else {
      const lateMins = Math.abs(diff);
      return {
        status: "LATE",
        labelKhmer: `🔴 មកយឺត ${formatMinutesKhmer(lateMins)}`,
        diffMinutes: lateMins,
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        detailKhmer: `យឺត ${formatMinutesKhmer(lateMins)} (${activeShift.shiftLabel} ម៉ោង ${targetCheckIn})`,
        shiftName: activeShift.shiftLabel,
        dayName: activeShift.dayLabel,
      };
    }
  } else {
    // CHECK_OUT
    const shiftEndMins = timeToMinutes(targetCheckOut);
    const diff = shiftEndMins - currentTotalMins;

    if (diff > 0) {
      return {
        status: "EARLY_LEAVE",
        labelKhmer: `🟠 ចេញមុន ${formatMinutesKhmer(diff)}`,
        diffMinutes: diff,
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        detailKhmer: `ចេញមុនម៉ោងកំណត់ ${formatMinutesKhmer(diff)} (${activeShift.shiftLabel} ម៉ោងចេញ ${targetCheckOut})`,
        shiftName: activeShift.shiftLabel,
        dayName: activeShift.dayLabel,
      };
    } else {
      return {
        status: "ON_TIME_LEAVE",
        labelKhmer: "🔵 ចេញធម្មតា",
        diffMinutes: 0,
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
        detailKhmer: `ចេញតាមម៉ោងកំណត់ (${activeShift.shiftLabel} ម៉ោងចេញ ${targetCheckOut})`,
        shiftName: activeShift.shiftLabel,
        dayName: activeShift.dayLabel,
      };
    }
  }
}
