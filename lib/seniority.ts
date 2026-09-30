// lib/seniority.ts - Helpers for Seniority, Date of Birth, Staff Hierarchy, and Multi-Shift Scheduling

import { Staff, StaffTier, StaffSchedule, DayShiftSchedule } from "@/types";

/**
 * Automatically calculate Khmer seniority text from start date to current date
 * e.g. "2 ឆ្នាំ 5 ខែ", "1 ឆ្នាំ", "8 ខែ", "ទើបចូលថ្មី (< ១ ខែ)"
 */
export function calculateSeniorityKhmer(startDateStr?: string): string {
  if (!startDateStr) return "មិនទាន់កំណត់";
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return startDateStr;

  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return "ទើបចូលថ្មី (< ១ ខែ)";
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ឆ្នាំ`);
  if (months > 0) parts.push(`${months} ខែ`);

  return parts.join(" ") || "ទើបចូលថ្មី";
}

/**
 * Calculate age from date of birth (YYYY-MM-DD)
 */
export function calculateAge(dobStr?: string): { age: number; labelKhmer: string } | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 0) return null;
  return { age, labelKhmer: `អាយុ ${age} ឆ្នាំ` };
}

/**
 * Format date string into DD/MM/YYYY
 */
export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Auto-detect staff tier (ថ្នាក់ដឹកនាំ vs បុគ្គលិកគ្រប់ផ្នែក) and direct supervisor
 * - ថ្នាក់ដឹកនាំ: ប្រធានសាខា, ជំនួយការCEO, ប្រធានគណនេយ្យ -> គ្រប់គ្រងដោយ CFO
 * - បុគ្គលិកគ្រប់ផ្នែក: គ្រូបង្រៀន, សន្តិសុខ, អនាម័យ, រដ្ឋបាល, គណនេយ្យករ -> គ្រប់គ្រងដោយប្រធានគណនេយ្យ
 */
export function resolveStaffTier(
  role: string,
  department?: string,
  explicitTier?: StaffTier,
  explicitSupervisor?: string
): { tier: StaffTier; supervisor: string } {
  if (explicitTier) {
    const supervisor =
      explicitSupervisor ||
      (explicitTier === "LEADERSHIP" ? "CFO" : "ប្រធានគណនេយ្យ");
    return { tier: explicitTier, supervisor };
  }

  const r = (role || "").toLowerCase();
  const d = (department || "").toLowerCase();

  // Leadership check
  const isLeadership =
    r.includes("ប្រធានសាខា") ||
    r.includes("ជំនួយការ") ||
    r.includes("ceo") ||
    r.includes("cfo") ||
    r.includes("ប្រធានគណនេយ្យ") ||
    r.includes("director") ||
    r.includes("branch manager") ||
    r.includes("super admin") ||
    d.includes("ការិយាល័យ ceo");

  if (isLeadership) {
    return { tier: "LEADERSHIP", supervisor: explicitSupervisor || "CFO" };
  }

  return {
    tier: "OPERATIONS",
    supervisor: explicitSupervisor || "ប្រធានគណនេយ្យ",
  };
}

/**
 * Generate default standard schedule (Mon-Fri, Sat, Sun with 2 shifts)
 */
export function createDefaultStaffSchedule(params?: {
  shiftHours?: number;
  checkInTime?: string;
  checkOutTime?: string;
  hasTwoShifts?: boolean;
}): StaffSchedule {
  const cIn = params?.checkInTime || "07:30";
  const cOut = params?.checkOutTime || "17:00";
  const twoShifts = params?.hasTwoShifts ?? true;

  // If two shifts, split appropriately (e.g. 07:30 - 11:30 and 13:00 - 17:00)
  const shift1In = cIn;
  const shift1Out = twoShifts ? "11:30" : cOut;
  const shift2In = "13:00";
  const shift2Out = cOut;

  return {
    monFri: {
      enabled: true,
      hasTwoShifts: twoShifts,
      shift1: { checkIn: shift1In, checkOut: shift1Out },
      shift2: { enabled: twoShifts, checkIn: shift2In, checkOut: shift2Out },
    },
    sat: {
      enabled: true,
      hasTwoShifts: false,
      shift1: { checkIn: shift1In, checkOut: "12:00" },
      shift2: { enabled: false, checkIn: "13:00", checkOut: "17:00" },
    },
    sun: {
      enabled: false,
      hasTwoShifts: false,
      shift1: { checkIn: shift1In, checkOut: "11:30" },
      shift2: { enabled: false, checkIn: "13:00", checkOut: "17:00" },
    },
  };
}
