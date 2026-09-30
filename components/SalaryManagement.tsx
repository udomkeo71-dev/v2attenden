"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Staff, BranchId, ShiftDurationHours, AttendanceRecord } from "@/types";
import { V2_BRANCHES, BRANCH_LIST } from "@/lib/branches";
import { loadStaffList, saveStaffList, loadAttendanceRecords } from "@/lib/storage";
import { soundEffects } from "@/lib/audio";
import {
  getMonthStrictWeeks,
  calculateStaffWeeklyReports,
  loadSalaryAdjustments,
  saveSalaryAdjustment,
  resetSalaryAdjustment,
  exportWeeklyPayrollCSV,
  getOrSeedAttendanceRecords,
  ManualSalaryAdjustment,
  StaffWeeklyReport,
  WeekRange,
} from "@/lib/payrollReport";
import {
  DollarSign,
  Search,
  Download,
  Edit2,
  Check,
  X,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  Briefcase,
  GraduationCap,
  Calendar,
  Building,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  ArrowUpDown,
  Calculator,
  AlertTriangle,
  RotateCcw,
  Layers,
  FileSpreadsheet,
  Lock,
  Crown,
} from "lucide-react";

interface SalaryManagementProps {
  onBack?: () => void;
  onStaffUpdated?: (updatedStaff: Staff[]) => void;
  onOpenAddStaff?: () => void;
}

const KHMER_MONTH_NAMES = [
  "មករា (១)",
  "កុម្ភៈ (២)",
  "មីនា (៣)",
  "មេសា (៤)",
  "ឧសភា (៥)",
  "មិថុនា (៦)",
  "កក្កដា (៧)",
  "សីហា (៨)",
  "កញ្ញា (៩)",
  "តុលា (១០)",
  "វិច្ឆិកា (១១)",
  "ធ្នូ (១២)",
];

export const SalaryManagement: React.FC<SalaryManagementProps> = ({
  onBack,
  onStaffUpdated,
  onOpenAddStaff,
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<Record<string, ManualSalaryAdjustment>>({});
  
  // Sub-view toggle: WEEKLY_REPORT (the main requested feature) vs STAFF_MASTER (base salary setup)
  const [activeSubView, setActiveSubView] = useState<"WEEKLY_REPORT" | "STAFF_MASTER">("WEEKLY_REPORT");

  // Date and Week Selection (Strictly No Crossing Months!)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 9 = September
  const [selectedWeek, setSelectedWeek] = useState<number | "ALL">("ALL");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "TEACHER" | "STAFF">("ALL");
  const [tierFilter, setTierFilter] = useState<"ALL" | "LEADERSHIP" | "OPERATIONS">("ALL");
  const [sortField, setSortField] = useState<"salary_desc" | "salary_asc" | "name" | "unfulfilled_desc">("unfulfilled_desc");

  // Quick Deduction Modal State
  const [deductionStaffReport, setDeductionStaffReport] = useState<StaffWeeklyReport | null>(null);
  const [inputDeductionAmount, setInputDeductionAmount] = useState<string>("");
  const [inputDeductionReason, setInputDeductionReason] = useState<string>("");
  const [inputBonusAmount, setInputBonusAmount] = useState<string>("");

  // Edit Base Salary Modal State (Staff Master)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editSalary, setEditSalary] = useState<number>(500);
  const [editShiftHours, setEditShiftHours] = useState<ShiftDurationHours>(8);
  const [editLeaveQuota, setEditLeaveQuota] = useState<number>(18);
  const [editLeaveUsed, setEditLeaveUsed] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const list = loadStaffList();
    setStaffList(list);

    // Load or seed attendance records for realistic reporting
    const records = getOrSeedAttendanceRecords(list);
    setAttendanceRecords(records);

    // Load saved manual adjustments
    const adjs = loadSalaryAdjustments();
    setManualAdjustments(adjs);
  }, []);

  const leadershipCount = useMemo(
    () =>
      staffList.filter(
        (s) =>
          (s.tier ||
            (s.role.includes("ប្រធាន") || s.role.includes("CEO") || s.role.includes("CFO")
              ? "LEADERSHIP"
              : "OPERATIONS")) === "LEADERSHIP"
      ).length,
    [staffList]
  );
  const operationsCount = staffList.length - leadershipCount;

  // Strict Weeks for Selected Month (Guaranteed: ហាមឆ្លងខែ)
  const strictWeeks: WeekRange[] = useMemo(() => {
    return getMonthStrictWeeks(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Period Key for adjustments e.g. "2026-09_w1"
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const currentPeriodKey = `${selectedYear}-${pad2(selectedMonth)}_w${selectedWeek}`;

  // Period Title in Khmer
  const currentPeriodTitle = useMemo(() => {
    const mName = KHMER_MONTH_NAMES[selectedMonth - 1];
    if (selectedWeek === "ALL") {
      return `ខែ ${mName} ឆ្នាំ ${selectedYear} (ពេញមួយខែ)`;
    }
    const w = strictWeeks.find((item) => item.weekIndex === selectedWeek);
    return `${w?.label || `សប្តាហ៍ទី ${selectedWeek}`} • ខែ ${mName} ឆ្នាំ ${selectedYear}`;
  }, [selectedMonth, selectedYear, selectedWeek, strictWeeks]);

  // Calculate Weekly Reports for all staff
  const weeklyReports = useMemo(() => {
    return calculateStaffWeeklyReports(
      staffList,
      attendanceRecords,
      selectedYear,
      selectedMonth,
      selectedWeek,
      manualAdjustments
    );
  }, [staffList, attendanceRecords, selectedYear, selectedMonth, selectedWeek, manualAdjustments]);

  // Filtered & Sorted Weekly Reports
  const filteredWeeklyReports = useMemo(() => {
    return weeklyReports
      .filter((r) => {
        if (branchFilter !== "ALL" && r.staffBranchId !== branchFilter) return false;
        if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;
        if (tierFilter !== "ALL") {
          const sTier =
            r.tier ||
            (r.staffRole.includes("ប្រធាន") ||
            r.staffRole.includes("CEO") ||
            r.staffRole.includes("CFO")
              ? "LEADERSHIP"
              : "OPERATIONS");
          if (sTier !== tierFilter) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = r.staffName.toLowerCase().includes(q);
          const matchRole = r.staffRole.toLowerCase().includes(q);
          const branchName = (V2_BRANCHES[r.staffBranchId as BranchId]?.nameKhmer || "").toLowerCase();
          if (!matchName && !matchRole && !branchName.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === "unfulfilled_desc") return b.totalUnfulfilledMinutes - a.totalUnfulfilledMinutes;
        if (sortField === "salary_desc") return b.baseSalary - a.baseSalary;
        if (sortField === "salary_asc") return a.baseSalary - b.baseSalary;
        return a.staffName.localeCompare(b.staffName, "km");
      });
  }, [weeklyReports, branchFilter, categoryFilter, tierFilter, searchQuery, sortField]);

  // Summary Metrics for Weekly Report
  const weeklyMetrics = useMemo(() => {
    const totalPayroll = filteredWeeklyReports.reduce((sum, r) => sum + r.netSalary, 0);
    const totalBaseSalary = filteredWeeklyReports.reduce((sum, r) => sum + r.baseSalary, 0);
    const totalDeductions = filteredWeeklyReports.reduce((sum, r) => sum + r.appliedDeduction, 0);
    const totalLateMinutes = filteredWeeklyReports.reduce((sum, r) => sum + r.lateMinutes, 0);
    const totalEarlyMinutes = filteredWeeklyReports.reduce((sum, r) => sum + r.earlyLeaveMinutes, 0);
    const totalLateHours = (totalLateMinutes / 60).toFixed(1);
    const totalEarlyHours = (totalEarlyMinutes / 60).toFixed(1);
    const staffWithDeduction = filteredWeeklyReports.filter((r) => r.appliedDeduction > 0).length;

    return {
      totalPayroll,
      totalBaseSalary,
      totalDeductions,
      totalLateMinutes,
      totalEarlyMinutes,
      totalLateHours,
      totalEarlyHours,
      staffWithDeduction,
      totalCount: filteredWeeklyReports.length,
    };
  }, [filteredWeeklyReports]);

  // Filtered & Sorted Staff List (for Staff Master view)
  const filteredStaffMaster = useMemo(() => {
    return staffList
      .filter((s) => {
        if (branchFilter !== "ALL" && s.branchId !== branchFilter) return false;
        if (categoryFilter !== "ALL") {
          const cat = s.category || "STAFF";
          if (cat !== categoryFilter) return false;
        }
        if (tierFilter !== "ALL") {
          const sTier =
            s.tier ||
            (s.role.includes("ប្រធាន") ||
            s.role.includes("CEO") ||
            s.role.includes("CFO")
              ? "LEADERSHIP"
              : "OPERATIONS");
          if (sTier !== tierFilter) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchRole = s.role.toLowerCase().includes(q);
          const matchBranch = (V2_BRANCHES[s.branchId]?.nameKhmer || "").toLowerCase().includes(q);
          if (!matchName && !matchRole && !matchBranch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const salA = a.baseSalary ?? 500;
        const salB = b.baseSalary ?? 500;
        if (sortField === "salary_desc") return salB - salA;
        if (sortField === "salary_asc") return salA - salB;
        return a.name.localeCompare(b.name, "km");
      });
  }, [staffList, branchFilter, categoryFilter, tierFilter, searchQuery, sortField]);

  // Open Quick Deduction Edit Modal
  const handleOpenDeductionModal = (report: StaffWeeklyReport) => {
    setDeductionStaffReport(report);
    setInputDeductionAmount(String(report.appliedDeduction));
    setInputDeductionReason(report.deductionReason || "");
    setInputBonusAmount(report.bonus ? String(report.bonus) : "0");
  };

  // Save Deduction from Modal
  const handleSaveDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductionStaffReport) return;

    const val = Math.max(0, Number(inputDeductionAmount) || 0);
    const reason = inputDeductionReason.trim();
    const bonus = Math.max(0, Number(inputBonusAmount) || 0);

    const updated = saveSalaryAdjustment(deductionStaffReport.staffId, currentPeriodKey, {
      customDeduction: val,
      deductionReason: reason,
      bonus,
    });

    setManualAdjustments(updated);
    soundEffects.playSuccess();
    setToastMessage(`បានរក្សាទុកការកាត់ប្រាក់ខែ "$${val}" ជូន "${deductionStaffReport.staffName}" ជោគជ័យ!`);
    setTimeout(() => setToastMessage(null), 3500);
    setDeductionStaffReport(null);
  };

  // 1-Tap Reset to Auto Deduction
  const handleResetToAuto = (report: StaffWeeklyReport) => {
    const updated = resetSalaryAdjustment(report.staffId, currentPeriodKey);
    setManualAdjustments(updated);
    soundEffects.playClick();
    setToastMessage(`បានកំណត់ការកាត់ប្រាក់ខែរបស់ "${report.staffName}" ទៅជាការគណនាស្វ័យប្រវត្តិវិញ ($${report.autoDeduction})`);
    setTimeout(() => setToastMessage(null), 3000);
    if (deductionStaffReport) {
      setDeductionStaffReport(null);
    }
  };

  // Handle direct inline deduction input change
  const handleInlineDeductionChange = (staffId: string, value: string) => {
    const num = Math.max(0, parseFloat(value) || 0);
    const updated = saveSalaryAdjustment(staffId, currentPeriodKey, {
      customDeduction: num,
    });
    setManualAdjustments(updated);
  };

  // Open Edit Base Salary Modal
  const handleOpenEditBaseSalary = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditSalary(staff.baseSalary ?? 500);
    setEditShiftHours(staff.shiftHours ?? 8);
    setEditLeaveQuota(staff.leaveQuota ?? 18);
    setEditLeaveUsed(staff.leaveUsed ?? 0);
  };

  // Save Base Salary Changes
  const handleSaveBaseSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const newSalary = Math.max(0, Number(editSalary) || 0);
    const updated = staffList.map((s) =>
      s.id === selectedStaff.id
        ? {
            ...s,
            baseSalary: newSalary,
            shiftHours: editShiftHours,
            leaveQuota: Number(editLeaveQuota) || 18,
            leaveUsed: Number(editLeaveUsed) || 0,
          }
        : s
    );

    setStaffList(updated);
    saveStaffList(updated);
    if (onStaffUpdated) onStaffUpdated(updated);

    soundEffects.playSuccess();
    setToastMessage(`បានកែប្រែប្រាក់ខែគោល "${selectedStaff.name}" ទៅជា $${newSalary} ជោគជ័យ!`);
    setTimeout(() => setToastMessage(null), 4000);
    setSelectedStaff(null);
  };

  // Export Weekly Report to CSV
  const handleExportWeeklyCSV = () => {
    exportWeeklyPayrollCSV(filteredWeeklyReports, currentPeriodTitle);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setSelectedWeek("ALL");
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setSelectedWeek("ALL");
  };

  return (
    <div className="space-y-4 font-kantumruy animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-0.5 p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition shrink-0"
                title="ត្រឡប់ទៅ Home"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-battambang text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>គ្រប់គ្រងប្រាក់ខែ & របាយការណ៍សប្តាហ៍</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  Payroll
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                របាយការណ៍វត្តមានប្រចាំសប្តាហ៍ ហាមឆ្លងខែ គណនាយឺត-ចេញមុន និងកាត់ប្រាក់ខែ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportWeeklyCSV}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold transition flex items-center gap-1.5"
              title="ទាញយករបាយការណ៍ជា Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {onOpenAddStaff && (
              <button
                type="button"
                onClick={onOpenAddStaff}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold font-battambang shadow-sm transition flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ថែមបុគ្គលិក</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 Primary Mode Tabs (Segmented Control) */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => setActiveSubView("WEEKLY_REPORT")}
            className={`py-2 px-3 rounded-xl font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
              activeSubView === "WEEKLY_REPORT"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>របាយការណ៍សប្តាហ៍ & កាត់ប្រាក់ខែ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("STAFF_MASTER")}
            className={`py-2 px-3 rounded-xl font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
              activeSubView === "STAFF_MASTER"
                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>តារាងប្រាក់ខែគោលបុគ្គលិក</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUBVIEW 1: WEEKLY ATTENDANCE & SALARY DEDUCTIONS REPORT (ហាមឆ្លងខែ) */}
        {/* ========================================================================= */}
        {activeSubView === "WEEKLY_REPORT" && (
          <div className="space-y-4 pt-1">
            {/* Month & Year Selection Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition"
                  title="ខែមុន"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-battambang flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>ខែ {KHMER_MONTH_NAMES[selectedMonth - 1]} ឆ្នាំ {selectedYear}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition"
                  title="ខែបន្ទាប់"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Strict No-Crossing Badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                <Lock className="w-3 h-3" />
                <span>ហាមឆ្លងខែ (Calendar Month Bound)</span>
              </div>
            </div>

            {/* Strict Week Selector Buttons (1-7, 8-14, 15-21, 22-28, 29-End) */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>ជ្រើសរើសសប្តាហ៍ធ្វើរបាយការណ៍ (មួយសប្តាហ៍ម្តង)៖</span>
                <span className="text-[10px] text-emerald-600 font-medium font-sans">
                  {currentPeriodTitle}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedWeek("ALL")}
                  className={`py-2 px-2 rounded-xl text-center transition font-battambang text-xs border ${
                    selectedWeek === "ALL"
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  សរុបពេញមួយខែ
                </button>

                {strictWeeks.map((w) => {
                  const isSelected = selectedWeek === w.weekIndex;
                  return (
                    <button
                      key={w.weekIndex}
                      type="button"
                      onClick={() => setSelectedWeek(w.weekIndex)}
                      className={`py-2 px-1 rounded-xl text-center transition font-battambang text-xs border ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {w.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Weekly Report KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Net Payroll */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-3 rounded-2xl space-y-1">
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span>ប្រាក់ខែជាក់ស្តែង</span>
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-200">
                  ${weeklyMetrics.totalPayroll.toLocaleString()}
                </div>
                <div className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80">
                  (ប្រាក់ខែគោល: ${weeklyMetrics.totalBaseSalary.toLocaleString()})
                </div>
              </div>

              {/* 2. Total Deductions */}
              <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 p-3 rounded-2xl space-y-1">
                <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                  <span>ប្រាក់កាត់សរុប</span>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-300">
                  -${weeklyMetrics.totalDeductions.toFixed(2)}
                </div>
                <div className="text-[9px] text-rose-600/80 dark:text-rose-400/80">
                  បុគ្គលិកត្រូវកាត់: {weeklyMetrics.staffWithDeduction} នាក់
                </div>
              </div>

              {/* 3. Total Late Hours */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 p-3 rounded-2xl space-y-1">
                <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                  <span>មកយឺតសរុប</span>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-lg font-bold font-mono text-amber-900 dark:text-amber-200">
                  {weeklyMetrics.totalLateHours} ម៉ោង
                </div>
                <div className="text-[9px] text-amber-600/80 dark:text-amber-400/80">
                  សរុប {weeklyMetrics.totalLateMinutes} នាទី
                </div>
              </div>

              {/* 4. Total Early Leave Hours */}
              <div className="bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800/40 p-3 rounded-2xl space-y-1">
                <div className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 flex items-center justify-between">
                  <span>ចេញមុនសរុប</span>
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="text-lg font-bold font-mono text-orange-900 dark:text-orange-200">
                  {weeklyMetrics.totalEarlyHours} ម៉ោង
                </div>
                <div className="text-[9px] text-orange-600/80 dark:text-orange-400/80">
                  សរុប {weeklyMetrics.totalEarlyMinutes} នាទី
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar & Sort Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ, តួនាទី, មុខវិជ្ជា, សាខា..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/80 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Menu */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 text-xs">
            <button
              type="button"
              onClick={() =>
                setSortField(
                  sortField === "unfulfilled_desc"
                    ? "salary_desc"
                    : sortField === "salary_desc"
                    ? "salary_asc"
                    : sortField === "salary_asc"
                    ? "name"
                    : "unfulfilled_desc"
                )
              }
              className="px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900"
              title="តម្រៀប"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold">
                {sortField === "unfulfilled_desc"
                  ? "ម៉ោងយឺតច្រើនជាងគេ"
                  : sortField === "salary_desc"
                  ? "$ ខ្ពស់ → ទាប"
                  : sortField === "salary_asc"
                  ? "$ ទាប → ខ្ពស់"
                  : "តាមឈ្មោះ (ក-អ)"}
              </span>
            </button>
          </div>
        </div>

        {/* Tier Hierarchy Separation (ថ្នាក់ដឹកនាំ vs បុគ្គលិកគ្រប់ផ្នែក) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[11px] font-battambang">
          <button
            type="button"
            onClick={() => setTierFilter("ALL")}
            className={`py-2 px-1 rounded-xl font-bold transition text-center ${
              tierFilter === "ALL"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <span>👥 ទាំងអស់ ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTierFilter("LEADERSHIP")}
            className={`py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              tierFilter === "LEADERSHIP"
                ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-400"
                : "text-amber-700 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/30"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 ថ្នាក់ដឹកនាំ ({leadershipCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTierFilter("OPERATIONS")}
            className={`py-2 px-1 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              tierFilter === "OPERATIONS"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>បុគ្គលិកទូទៅ ({operationsCount})</span>
          </button>
        </div>

        {/* Manager/Supervisor Info Banner for the active Tier */}
        {tierFilter === "LEADERSHIP" && (
          <div className="p-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>ថ្នាក់ដឹកនាំ (ប្រធានសាខា, ជំនួយការ CEO, ប្រធានគណនេយ្យ)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 font-bold text-[10px]">
              គ្រប់គ្រងដោយ CFO
            </span>
          </div>
        )}
        {tierFilter === "OPERATIONS" && (
          <div className="p-2.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between text-[11px] text-blue-900 dark:text-blue-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>បុគ្គលិកគ្រប់ផ្នែក (គ្រូបង្រៀន, សន្តិសុខ, អនាម័យ, រដ្ឋបាល, គណនេយ្យ...)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 font-bold text-[10px]">
              គ្រប់គ្រងដោយប្រធានគណនេយ្យ
            </span>
          </div>
        )}

        {/* 1-Tap Category Filters */}
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition text-center ${
              categoryFilter === "ALL"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            ទាំងអស់ ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("TEACHER")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              categoryFilter === "TEACHER"
                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>គ្រូបង្រៀន</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("STAFF")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              categoryFilter === "STAFF"
                ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>បុគ្គលិកទូទៅ</span>
          </button>
        </div>

        {/* 1-Tap Branch Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setBranchFilter("ALL")}
            className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition shrink-0 ${
              branchFilter === "ALL"
                ? "bg-emerald-600 text-white font-bold shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            គ្រប់សាខា ({staffList.length})
          </button>
          {BRANCH_LIST.map((b) => {
            const count = staffList.filter((s) => s.branchId === b.id).length;
            const isSelected = branchFilter === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBranchFilter(b.id)}
                className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? "bg-emerald-600 text-white font-bold shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? "#ffffff" : b.color }}
                />
                <span>{b.nameKhmer} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1 LIST: WEEKLY ATTENDANCE & SALARY DEDUCTION CARDS */}
      {/* ========================================================================= */}
      {activeSubView === "WEEKLY_REPORT" && (
        <div className="space-y-3">
          {filteredWeeklyReports.map((report) => {
            const branch = V2_BRANCHES[report.staffBranchId as BranchId];
            const isTeacher = report.category === "TEACHER";
            const hasIssues = report.totalUnfulfilledMinutes > 0;

            return (
              <div
                key={report.staffId}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Header Row: Staff Info & Net Pay */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xs text-base shrink-0"
                      style={{ backgroundColor: branch?.color || "#3b82f6" }}
                    >
                      {report.staffName.slice(0, 1)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-battambang truncate">
                          {report.staffName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isTeacher
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          }`}
                        >
                          {isTeacher ? "គ្រូបង្រៀន" : "បុគ្គលិក"}
                        </span>
                        {report.hasManualOverride && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            កែដោយ Admin
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{report.staffRole}</span>
                        <span>•</span>
                        <span style={{ color: branch?.color }} className="font-semibold">
                          {branch?.nameKhmer}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          គោល ${report.baseSalary}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          (${report.hourlyRate}/h)
                        </span>
                      </div>

                      {/* Tier & Seniority Badges */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {report.tier === "LEADERSHIP" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span>ថ្នាក់ដឹកនាំ • គ្រប់គ្រងដោយ CFO</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>បុគ្គលិក • គ្រប់គ្រងដោយ {report.supervisor || "ប្រធានគណនេយ្យ"}</span>
                          </span>
                        )}
                        {report.seniority && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            🎖️ {report.seniority}
                          </span>
                        )}
                        {report.dateOfBirth && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            🎂 {report.dateOfBirth}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Amount */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ${report.netSalary.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-slate-400">បើកជាក់ស្តែង</div>
                  </div>
                </div>

                {/* Attendance Late & Early Departure Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  {/* 1. មកយឺត (Late Hours) */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-battambang">
                      <Clock className="w-3 h-3 text-rose-500" />
                      <span>មកយឺត</span>
                    </div>
                    <div className={`font-mono font-bold ${report.lateMinutes > 0 ? "text-rose-600" : "text-slate-700 dark:text-slate-300"}`}>
                      {report.lateFormatted}
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      ({report.lateCount} លើក)
                    </div>
                  </div>

                  {/* 2. ចេញមុន (Early Departure) */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-battambang">
                      <Clock className="w-3 h-3 text-orange-500" />
                      <span>ចេញមុន</span>
                    </div>
                    <div className={`font-mono font-bold ${report.earlyLeaveMinutes > 0 ? "text-orange-600" : "text-slate-700 dark:text-slate-300"}`}>
                      {report.earlyLeaveFormatted}
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      ({report.earlyLeaveCount} លើក)
                    </div>
                  </div>

                  {/* 3. សរុបម៉ោងខកខាន */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-battambang">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>សរុបខកខាន</span>
                    </div>
                    <div className={`font-mono font-bold ${hasIssues ? "text-amber-600" : "text-emerald-600"}`}>
                      {report.totalUnfulfilledFormatted}
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      ({report.totalUnfulfilledHours} ម៉ោង)
                    </div>
                  </div>
                </div>

                {/* DEDUCTION ROW: Auto Calculation + Admin Manual Input Field */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-battambang">
                      <span>កាត់ប្រាក់ខែ (Deduction)៖</span>
                      <span className="text-[10px] text-slate-400 font-normal font-sans">
                        Auto: ${report.autoDeduction.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {report.hasManualOverride ? (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          Admin បានបញ្ចូលផ្ទាល់: ${report.appliedDeduction}
                          {report.deductionReason && ` (${report.deductionReason})`}
                        </span>
                      ) : (
                        <span>គណនាស្វ័យប្រវត្តិតាមម៉ោងខកខាន (${report.hourlyRate}/h)</span>
                      )}
                    </div>
                  </div>

                  {/* Manual Input Field for Admin ("សម្រាប់ខ្ញុំបញ្ចូល") */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-bold text-rose-500 font-mono">
                        -$
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={report.appliedDeduction}
                        onChange={(e) => handleInlineDeductionChange(report.staffId, e.target.value)}
                        className="w-24 pl-7 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-bold font-mono text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        title="បញ្ចូលទឹកប្រាក់កាត់ដោយផ្ទាល់ (Admin Input)"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDeductionModal(report)}
                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition"
                      title="កែសម្រួលលម្អិត និងមូលហេតុ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {report.hasManualOverride && (
                      <button
                        type="button"
                        onClick={() => handleResetToAuto(report)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition"
                        title="កំណត់ទៅស្វ័យប្រវត្តិវិញ"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredWeeklyReports.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">មិនមានបុគ្គលិកត្រូវតាមការស្វែងរកឡើយ</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2 LIST: STAFF BASE SALARY MASTER (គ្រប់គ្រងប្រាក់ខែគោល) */}
      {/* ========================================================================= */}
      {activeSubView === "STAFF_MASTER" && (
        <div className="space-y-3">
          {filteredStaffMaster.map((staff) => {
            const branch = V2_BRANCHES[staff.branchId];
            const salary = staff.baseSalary ?? 500;
            const shift = staff.shiftHours ?? 8;
            const dailyRate = (salary / 26).toFixed(2);
            const hourlyRate = (salary / 26 / shift).toFixed(2);
            const isTeacher = staff.category === "TEACHER";
            const quota = staff.leaveQuota ?? 18;
            const used = staff.leaveUsed ?? 0;
            const remaining = Math.max(0, quota - used);

            return (
              <div
                key={staff.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Row Header: Profile, Branch, and Base Salary Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xs text-base shrink-0"
                      style={{ backgroundColor: branch?.color || "#3b82f6" }}
                    >
                      {staff.name.slice(0, 1)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-battambang truncate">
                          {staff.name}
                        </span>
                        {staff.isAdmin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Admin
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isTeacher
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          }`}
                        >
                          {isTeacher ? "គ្រូបង្រៀន" : "បុគ្គលិក"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{staff.role}</span>
                        <span>•</span>
                        <span style={{ color: branch?.color }} className="font-semibold">
                          {branch?.nameKhmer}
                        </span>
                        {staff.subject && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {staff.subject}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tier & Seniority Badges */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {staff.tier === "LEADERSHIP" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span>ថ្នាក់ដឹកនាំ • គ្រប់គ្រងដោយ CFO</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>បុគ្គលិក • គ្រប់គ្រងដោយ {staff.supervisor || "ប្រធានគណនេយ្យ"}</span>
                          </span>
                        )}
                        {staff.seniority && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            🎖️ {staff.seniority}
                          </span>
                        )}
                        {staff.dateOfBirth && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            🎂 {staff.dateOfBirth}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Base Salary Big Badge & 1-Tap Edit Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ${salary}
                      </div>
                      <div className="text-[9px] text-slate-400">/ ខែ</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditBaseSalary(staff)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-2xl transition flex items-center gap-1 text-xs font-bold font-battambang active:scale-95"
                      title="កែសម្រួលប្រាក់ខែគោល"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">កែប្រែ</span>
                    </button>
                  </div>
                </div>

                {/* 3 iOS Inset Metrics: Daily Rate, Hourly Rate, Shift & Leave Balance */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-battambang">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      <span>គិតជាថ្ងៃ</span>
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${dailyRate} <span className="text-[9px] font-normal text-slate-400">/ថ្ងៃ</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      (÷ 26 ថ្ងៃ)
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-battambang">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>គិតជាម៉ោង</span>
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${hourlyRate} <span className="text-[9px] font-normal text-slate-400">/ម៉ោង</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      (វេន {shift} ម៉ោង)
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-battambang">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>កូតាច្បាប់</span>
                    </div>
                    <div className="font-mono font-bold text-purple-700 dark:text-purple-300">
                      សល់ {remaining} <span className="text-[9px] font-normal text-slate-400">/ {quota} ថ្ងៃ</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans">
                      (ឈប់រួច {used} ថ្ងៃ)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStaffMaster.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">មិនមានបុគ្គលិកត្រូវតាមការស្វែងរកឡើយ</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: QUICK DEDUCTION INPUT & REASON MODAL (ADMIN ONLY) */}
      {/* ========================================================= */}
      {deductionStaffReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-battambang text-slate-900 dark:text-white">
                    កាត់ប្រាក់ខែបុគ្គលិក (Deduction)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {deductionStaffReport.staffName} • {currentPeriodTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeductionStaffReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeduction} className="p-5 space-y-4">
              {/* Summary Unfulfilled Hours Card */}
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                  <span>ទិន្នន័យខកខានការងារ៖</span>
                  <span className="font-mono">ប្រាក់ខែគោល: ${deductionStaffReport.baseSalary}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400">មកយឺត</div>
                    <div className="font-bold font-mono text-rose-600">
                      {deductionStaffReport.lateFormatted}
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400">ចេញមុន</div>
                    <div className="font-bold font-mono text-orange-600">
                      {deductionStaffReport.earlyLeaveFormatted}
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400">គណនាស្វ័យប្រវត្តិ</div>
                    <div className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      ${deductionStaffReport.autoDeduction}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deduction Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-battambang">
                  ទឹកប្រាក់ត្រូវកាត់ (USD $) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-600 font-mono">
                    -$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={inputDeductionAmount}
                    onChange={(e) => setInputDeductionAmount(e.target.value)}
                    placeholder="បញ្ចូលចំនួនប្រាក់កាត់ ឧ. 10.00"
                    className="w-full pl-9 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-base font-bold font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    USD
                  </span>
                </div>

                {/* 1-Tap Quick Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setInputDeductionAmount(String(deductionStaffReport.autoDeduction))}
                    className="text-[11px] font-battambang px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    ប្រើស្វ័យប្រវត្តិ (${deductionStaffReport.autoDeduction})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputDeductionAmount("0")}
                    className="text-[11px] font-battambang px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  >
                    លើកលែង (មិនកាត់ $0)
                  </button>
                </div>
              </div>

              {/* Deduction Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-battambang">
                  មូលហេតុនៃការកាត់ប្រាក់ខែ (Optional Note)
                </label>
                <input
                  type="text"
                  value={inputDeductionReason}
                  onChange={(e) => setInputDeductionReason(e.target.value)}
                  placeholder="ឧ. មកយឺត ២ លើក, ចេញមុនម៉ោង, ឬ អវត្តមានគ្មានច្បាប់..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Net Pay Preview */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold font-battambang text-slate-700 dark:text-slate-300">
                  ប្រាក់ខែបើកជាក់ស្តែង៖
                </span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ${Math.max(0, deductionStaffReport.baseSalary - (Number(inputDeductionAmount) || 0)).toFixed(2)}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeductionStaffReport(null)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-battambang shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>រក្សាទុកការកាត់</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: BASE SALARY EDIT MODAL (STAFF MASTER VIEW) */}
      {/* ========================================================= */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-battambang text-slate-900 dark:text-white">
                    កែប្រែប្រាក់ខែគោលបុគ្គលិក
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedStaff.name} ({selectedStaff.role})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBaseSalary} className="p-5 space-y-4">
              {/* Dynamic Live Calculation Card */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-battambang">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>ការគណនាស្វ័យប្រវត្តិតាមប្រាក់ខែថ្មី៖</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <div className="text-[10px] text-slate-400">ប្រាក់ខែគោល</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                      ${editSalary || 0}
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <div className="text-[10px] text-slate-400">ប្រាក់ខែ/ថ្ងៃ</div>
                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      ${((editSalary || 0) / 26).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <div className="text-[10px] text-slate-400">ប្រាក់ខែ/ម៉ោង</div>
                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      ${(((editSalary || 0) / 26) / (editShiftHours || 8)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Base Salary Input ($) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-battambang">
                  ប្រាក់ខែគោល (USD $) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={editSalary}
                    onChange={(e) => setEditSalary(Number(e.target.value))}
                    placeholder="បញ្ចូលប្រាក់ខែគោល ឧ. 500"
                    className="w-full pl-8 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-base font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    / ខែ
                  </span>
                </div>

                {/* Quick Increment/Decrement Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[-50, 20, 50, 100, 200].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setEditSalary((prev) => Math.max(0, prev + delta))}
                      className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 transition text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Shift Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-battambang">
                  វេលាធ្វើការ (ម៉ោងក្នុងមួយថ្ងៃ) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {([2, 4, 6, 8, 12.5] as ShiftDurationHours[]).map((hours) => {
                    const isSelected = editShiftHours === hours;
                    return (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setEditShiftHours(hours)}
                        className={`py-2 px-1 rounded-xl text-center transition font-battambang text-xs border ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 font-bold shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {hours} ម៉ោង
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Leave Quota & Leave Used */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    កូតាច្បាប់ AL សរុប (ថ្ងៃ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={editLeaveQuota}
                    onChange={(e) => setEditLeaveQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    ច្បាប់ធ្លាប់ឈប់រួច (ថ្ងៃ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={editLeaveUsed}
                    onChange={(e) => setEditLeaveUsed(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-battambang shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>រក្សាទុកប្រាក់ខែ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
