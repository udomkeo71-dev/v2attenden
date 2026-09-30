import { Staff, AttendanceRecord } from "@/types";
import { formatMinutesKhmer } from "./punctuality";
import { V2_BRANCHES } from "./branches";
import { loadAttendanceRecords } from "./storage";

export interface WeekRange {
  weekIndex: number;
  label: string;
  shortLabel: string;
  startDay: number;
  endDay: number;
  startDateStr: string; // "YYYY-MM-DD"
  endDateStr: string;   // "YYYY-MM-DD"
}

export interface ManualSalaryAdjustment {
  staffId: string;
  periodKey: string; // e.g. "2026-09_w1" or "2026-09_all"
  customDeduction?: number; // USD deduction entered by Admin
  deductionReason?: string; // Reason note
  bonus?: number; // USD bonus
  updatedAt: string;
}

export interface StaffWeeklyReport {
  staffId: string;
  staffName: string;
  staffRole: string;
  staffBranchId: string;
  category: "TEACHER" | "STAFF";
  tier?: "LEADERSHIP" | "OPERATIONS";
  supervisor?: string;
  dateOfBirth?: string;
  seniority?: string;
  baseSalary: number;
  shiftHours: number;
  dailyRate: number;
  hourlyRate: number;

  // Period info
  periodLabel: string;
  weekIndex: number | "ALL";

  // Attendance metrics
  lateCount: number;
  lateMinutes: number;
  lateFormatted: string; // e.g. "1 ម៉ោង 15 នាទី"

  earlyLeaveCount: number;
  earlyLeaveMinutes: number;
  earlyLeaveFormatted: string; // e.g. "45 នាទី"

  totalUnfulfilledMinutes: number;
  totalUnfulfilledHours: number; // decimal e.g. 2.0
  totalUnfulfilledFormatted: string;

  // Financial calculations
  autoDeduction: number; // Auto calculated: unfulfilledHours * hourlyRate
  appliedDeduction: number; // Either manual input by admin or auto
  hasManualOverride: boolean;
  deductionReason?: string;
  bonus: number;
  netSalary: number; // baseSalary - appliedDeduction + bonus
}

const STORAGE_KEY_SALARY_ADJUSTMENTS = "v2_salary_manual_adjustments_v1";

/**
 * Strictly partition a month into non-crossing weeks:
 * Week 1: Day 01 - 07
 * Week 2: Day 08 - 14
 * Week 3: Day 15 - 21
 * Week 4: Day 22 - 28
 * Week 5: Day 29 - End of Month (strictly no crossing months!)
 */
export function getMonthStrictWeeks(year: number, month: number): WeekRange[] {
  // month is 1-indexed (1 to 12)
  const daysInMonth = new Date(year, month, 0).getDate();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const monthStr = pad2(month);

  const weeks: WeekRange[] = [
    {
      weekIndex: 1,
      label: "សប្តាហ៍ទី ១ (ថ្ងៃ ០១ - ០៧)",
      shortLabel: "សប្តាហ៍ ១ (១-៧)",
      startDay: 1,
      endDay: 7,
      startDateStr: `${year}-${monthStr}-01`,
      endDateStr: `${year}-${monthStr}-07`,
    },
    {
      weekIndex: 2,
      label: "សប្តាហ៍ទី ២ (ថ្ងៃ ០៨ - ១៤)",
      shortLabel: "សប្តាហ៍ ២ (៨-១៤)",
      startDay: 8,
      endDay: 14,
      startDateStr: `${year}-${monthStr}-08`,
      endDateStr: `${year}-${monthStr}-14`,
    },
    {
      weekIndex: 3,
      label: "សប្តាហ៍ទី ៣ (ថ្ងៃ ១៥ - ២១)",
      shortLabel: "សប្តាហ៍ ៣ (១៥-២១)",
      startDay: 15,
      endDay: 21,
      startDateStr: `${year}-${monthStr}-15`,
      endDateStr: `${year}-${monthStr}-21`,
    },
    {
      weekIndex: 4,
      label: "សប្តាហ៍ទី ៤ (ថ្ងៃ ២២ - ២៨)",
      shortLabel: "សប្តាហ៍ ៤ (២២-២៨)",
      startDay: 22,
      endDay: 28,
      startDateStr: `${year}-${monthStr}-22`,
      endDateStr: `${year}-${monthStr}-28`,
    },
  ];

  if (daysInMonth >= 29) {
    weeks.push({
      weekIndex: 5,
      label: `សប្តាហ៍ទី ៥ (ថ្ងៃ ២៩ - ${daysInMonth})`,
      shortLabel: `សប្តាហ៍ ៥ (២៩-${daysInMonth})`,
      startDay: 29,
      endDay: daysInMonth,
      startDateStr: `${year}-${monthStr}-29`,
      endDateStr: `${year}-${monthStr}-${pad2(daysInMonth)}`,
    });
  }

  return weeks;
}

/**
 * Load manual salary adjustments saved by admin in localStorage
 */
export function loadSalaryAdjustments(): Record<string, ManualSalaryAdjustment> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SALARY_ADJUSTMENTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save a manual salary adjustment for a staff and period
 */
export function saveSalaryAdjustment(
  staffId: string,
  periodKey: string,
  adjustment: Partial<ManualSalaryAdjustment>
): Record<string, ManualSalaryAdjustment> {
  if (typeof window === "undefined") return {};
  try {
    const current = loadSalaryAdjustments();
    const key = `${staffId}__${periodKey}`;
    const updated = {
      ...current,
      [key]: {
        staffId,
        periodKey,
        customDeduction: adjustment.customDeduction,
        deductionReason: adjustment.deductionReason || "",
        bonus: adjustment.bonus || 0,
        updatedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY_SALARY_ADJUSTMENTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to save salary adjustment", err);
    return {};
  }
}

/**
 * Reset manual deduction back to auto calculation
 */
export function resetSalaryAdjustment(
  staffId: string,
  periodKey: string
): Record<string, ManualSalaryAdjustment> {
  if (typeof window === "undefined") return {};
  try {
    const current = loadSalaryAdjustments();
    const key = `${staffId}__${periodKey}`;
    const updated = { ...current };
    delete updated[key];
    localStorage.setItem(STORAGE_KEY_SALARY_ADJUSTMENTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to reset salary adjustment", err);
    return {};
  }
}

/**
 * Get or seed attendance records for realistic demonstration if none exist
 */
export function getOrSeedAttendanceRecords(staffList: Staff[]): AttendanceRecord[] {
  const current = loadAttendanceRecords();
  if (current && current.length >= 10) {
    return current;
  }

  // Generate realistic attendance records across September 2026
  const seeded: AttendanceRecord[] = [...current];
  const year = 2026;
  const month = 9;

  // Selected sample days across weeks 1, 2, 3, 4, 5
  const sampleDays = [
    { day: 2, lateStaffIdx: 1, lateMins: 25, earlyStaffIdx: 2, earlyMins: 30 },
    { day: 4, lateStaffIdx: 3, lateMins: 40, earlyStaffIdx: 1, earlyMins: 15 },
    { day: 9, lateStaffIdx: 2, lateMins: 15, earlyStaffIdx: 4, earlyMins: 45 },
    { day: 12, lateStaffIdx: 4, lateMins: 30, earlyStaffIdx: 3, earlyMins: 20 },
    { day: 16, lateStaffIdx: 1, lateMins: 35, earlyStaffIdx: 5, earlyMins: 25 },
    { day: 18, lateStaffIdx: 5, lateMins: 20, earlyStaffIdx: 2, earlyMins: 30 },
    { day: 23, lateStaffIdx: 2, lateMins: 45, earlyStaffIdx: 1, earlyMins: 20 },
    { day: 25, lateStaffIdx: 3, lateMins: 15, earlyStaffIdx: 4, earlyMins: 35 },
    { day: 29, lateStaffIdx: 4, lateMins: 20, earlyStaffIdx: 3, earlyMins: 15 },
  ];

  sampleDays.forEach((sample, i) => {
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const dayStr = pad2(sample.day);
    const dateStr = `${dayStr}/09/2026`;
    const isoDateBase = `2026-09-${dayStr}`;

    staffList.slice(0, 7).forEach((staff, staffIdx) => {
      const isLate = staffIdx === sample.lateStaffIdx;
      const isEarly = staffIdx === sample.earlyStaffIdx;
      const branch = V2_BRANCHES[staff.branchId];

      // Check-in record
      const checkInMinutes = isLate ? sample.lateMins : 0;
      const inTime = isLate ? `08:${pad2(checkInMinutes)}:00` : `07:25:00`;
      seeded.push({
        id: `seed-in-${staff.id}-${sample.day}-${i}`,
        timestamp: `${isoDateBase}T${inTime}.000Z`,
        formattedTime: inTime,
        formattedDate: dateStr,
        type: "CHECK_IN",
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        branchId: staff.branchId,
        branchName: branch?.nameKhmer || "សាខា",
        userCoords: { latitude: branch?.latitude || 11.55, longitude: branch?.longitude || 104.92 },
        geofence: {
          isWithinGeofence: true,
          distanceMeters: 35,
          branchRadiusMeters: 100,
          statusLabelKhmer: "✅ ក្នុងបរិវេណ",
          googleMapsUrl: "",
        },
        punctuality: isLate
          ? {
              status: "LATE",
              labelKhmer: `🔴 មកយឺត ${sample.lateMins} នាទី`,
              diffMinutes: sample.lateMins,
              badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
              detailKhmer: `យឺត ${sample.lateMins} នាទី (វេនម៉ោង ${staff.checkInTime})`,
            }
          : {
              status: "ON_TIME",
              labelKhmer: "🔵 ទាន់ម៉ោង",
              diffMinutes: 0,
              badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
              detailKhmer: "មកទាន់ម៉ោងល្អ",
            },
        aiVerification: {
          isValid: true,
          isRealPerson: true,
          summaryKhmer: "ផ្ទៀងផ្ទាត់ផ្ទៃមុខត្រឹមត្រូវ",
        },
        telegramNotified: true,
      });

      // Check-out record
      if (isEarly) {
        seeded.push({
          id: `seed-out-${staff.id}-${sample.day}-${i}`,
          timestamp: `${isoDateBase}T16:30:00.000Z`,
          formattedTime: "16:30:00",
          formattedDate: dateStr,
          type: "CHECK_OUT",
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role,
          branchId: staff.branchId,
          branchName: branch?.nameKhmer || "សាខា",
          userCoords: { latitude: branch?.latitude || 11.55, longitude: branch?.longitude || 104.92 },
          geofence: {
            isWithinGeofence: true,
            distanceMeters: 25,
            branchRadiusMeters: 100,
            statusLabelKhmer: "✅ ក្នុងបរិវេណ",
            googleMapsUrl: "",
          },
          punctuality: {
            status: "EARLY_LEAVE",
            labelKhmer: `🟠 ចេញមុន ${sample.earlyMins} នាទី`,
            diffMinutes: sample.earlyMins,
            badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
            detailKhmer: `ចេញមុនម៉ោងកំណត់ ${sample.earlyMins} នាទី`,
          },
          aiVerification: {
            isValid: true,
            isRealPerson: true,
            summaryKhmer: "ផ្ទៀងផ្ទាត់ត្រឹមត្រូវ",
          },
          telegramNotified: true,
        });
      }
    });
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("v2_attendance_records_v1", JSON.stringify(seeded.slice(0, 300)));
    } catch {
      // Ignore quota error
    }
  }

  return seeded;
}

/**
 * Calculate weekly attendance & salary breakdown for all staff
 */
export function calculateStaffWeeklyReports(
  staffList: Staff[],
  records: AttendanceRecord[],
  year: number,
  month: number,
  weekSelection: number | "ALL",
  manualAdjustments: Record<string, ManualSalaryAdjustment>
): StaffWeeklyReport[] {
  const weeks = getMonthStrictWeeks(year, month);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const monthStr = pad2(month);
  const daysInMonth = new Date(year, month, 0).getDate();

  let startDay = 1;
  let endDay = daysInMonth;
  let periodLabel = `ខែ ${month}/${year} (ពេញមួយខែ)`;

  if (weekSelection !== "ALL") {
    const matchedWeek = weeks.find((w) => w.weekIndex === weekSelection);
    if (matchedWeek) {
      startDay = matchedWeek.startDay;
      endDay = matchedWeek.endDay;
      periodLabel = matchedWeek.label;
    }
  }

  const periodKey = `${year}-${monthStr}_w${weekSelection}`;

  return staffList.map((staff) => {
    const baseSalary = staff.baseSalary ?? 500;
    const shiftHours = staff.shiftHours ?? 8;
    const dailyRate = Math.round((baseSalary / 26) * 100) / 100;
    const hourlyRate = Math.round((dailyRate / shiftHours) * 100) / 100;

    // Filter attendance records for this staff within strict date boundaries
    const staffRecords = records.filter((r) => {
      if (r.staffId !== staff.id && r.staffName !== staff.name) return false;
      const recDate = new Date(r.timestamp);
      if (isNaN(recDate.getTime())) return false;
      if (recDate.getFullYear() !== year || recDate.getMonth() + 1 !== month) return false;
      const day = recDate.getDate();
      return day >= startDay && day <= endDay;
    });

    let lateCount = 0;
    let lateMinutes = 0;
    let earlyLeaveCount = 0;
    let earlyLeaveMinutes = 0;

    staffRecords.forEach((r) => {
      if (r.type === "CHECK_IN") {
        if (r.punctuality?.status === "LATE") {
          lateCount++;
          lateMinutes += r.punctuality.diffMinutes || 0;
        }
      } else if (r.type === "CHECK_OUT") {
        if (r.punctuality?.status === "EARLY_LEAVE") {
          earlyLeaveCount++;
          earlyLeaveMinutes += r.punctuality.diffMinutes || 0;
        }
      }
    });

    const totalUnfulfilledMinutes = lateMinutes + earlyLeaveMinutes;
    const totalUnfulfilledHours = Math.round((totalUnfulfilledMinutes / 60) * 100) / 100;

    // Calculate auto deduction
    const autoDeduction = Math.round(totalUnfulfilledHours * hourlyRate * 100) / 100;

    // Check manual override by admin
    const adjKey = `${staff.id}__${periodKey}`;
    const adj = manualAdjustments[adjKey];

    const hasManualOverride = adj !== undefined && adj.customDeduction !== undefined;
    const appliedDeduction = hasManualOverride
      ? Math.max(0, adj.customDeduction || 0)
      : autoDeduction;

    const bonus = adj?.bonus || 0;
    const deductionReason = adj?.deductionReason || "";

    const netSalary = Math.max(0, Math.round((baseSalary - appliedDeduction + bonus) * 100) / 100);

    return {
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      staffBranchId: staff.branchId,
      category: staff.category || "STAFF",
      tier: staff.tier || (staff.role.includes("ប្រធាន") || staff.role.includes("CEO") ? "LEADERSHIP" : "OPERATIONS"),
      supervisor: staff.supervisor || (staff.tier === "LEADERSHIP" ? "CFO" : "ប្រធានគណនេយ្យ"),
      dateOfBirth: staff.dateOfBirth,
      seniority: staff.seniority,
      baseSalary,
      shiftHours,
      dailyRate,
      hourlyRate,
      periodLabel,
      weekIndex: weekSelection,
      lateCount,
      lateMinutes,
      lateFormatted: lateMinutes > 0 ? formatMinutesKhmer(lateMinutes) : "០ នាទី",
      earlyLeaveCount,
      earlyLeaveMinutes,
      earlyLeaveFormatted: earlyLeaveMinutes > 0 ? formatMinutesKhmer(earlyLeaveMinutes) : "០ នាទី",
      totalUnfulfilledMinutes,
      totalUnfulfilledHours,
      totalUnfulfilledFormatted:
        totalUnfulfilledMinutes > 0 ? formatMinutesKhmer(totalUnfulfilledMinutes) : "០ នាទី",
      autoDeduction,
      appliedDeduction,
      hasManualOverride,
      deductionReason,
      bonus,
      netSalary,
    };
  });
}

/**
 * Export Weekly Report to Excel/CSV
 */
export function exportWeeklyPayrollCSV(
  reports: StaffWeeklyReport[],
  periodTitle: string
): void {
  if (reports.length === 0) {
    alert("មិនមានទិន្នន័យដើម្បីទាញយកឡើយ!");
    return;
  }

  const headers = [
    "ល.រ",
    "ឈ្មោះបុគ្គលិក",
    "សាខា",
    "តួនាទី",
    "កាលបរិច្ឆេទ/សប្តាហ៍",
    "ប្រាក់ខែគោល ($)",
    "ប្រាក់ខែ/ម៉ោង ($)",
    "មកយឺត (ដង)",
    "មកយឺត (ម៉ោង/នាទី)",
    "ចេញមុន (ដង)",
    "ចេញមុន (ម៉ោង/នាទី)",
    "សរុបម៉ោងខកខាន",
    "កាត់ស្វ័យប្រវត្តិ ($)",
    "កាត់ជាក់ស្តែងដោយ Admin ($)",
    "ប្រភេទទិន្នន័យកាត់",
    "មូលហេតុកាត់",
    "ប្រាក់ខែបើកជាក់ស្តែង ($)",
  ];

  const rows = reports.map((r, idx) => {
    const branch = V2_BRANCHES[r.staffBranchId as keyof typeof V2_BRANCHES]?.nameKhmer || r.staffBranchId;
    const deductionType = r.hasManualOverride ? "Admin បញ្ចូលផ្ទាល់" : "គណនាស្វ័យប្រវត្តិ";

    return [
      `"${idx + 1}"`,
      `"${r.staffName}"`,
      `"${branch}"`,
      `"${r.staffRole}"`,
      `"${r.periodLabel}"`,
      `"$${r.baseSalary}"`,
      `"$${r.hourlyRate}"`,
      `"${r.lateCount}"`,
      `"${r.lateFormatted}"`,
      `"${r.earlyLeaveCount}"`,
      `"${r.earlyLeaveFormatted}"`,
      `"${r.totalUnfulfilledFormatted}"`,
      `"$${r.autoDeduction}"`,
      `"$${r.appliedDeduction}"`,
      `"${deductionType}"`,
      `"${r.deductionReason || "-"}"`,
      `"$${r.netSalary}"`,
    ];
  });

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = periodTitle.replace(/[^a-zA-Z0-9_\u1780-\u17FF]/g, "_");
  link.setAttribute("download", `V2_Weekly_Payroll_Report_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
