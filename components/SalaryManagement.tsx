"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Staff, BranchId, ShiftDurationHours, StaffCategory } from "@/types";
import { V2_BRANCHES, BRANCH_LIST } from "@/lib/branches";
import { loadStaffList, saveStaffList } from "@/lib/storage";
import { soundEffects } from "@/lib/audio";
import {
  DollarSign,
  Search,
  Filter,
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
} from "lucide-react";

interface SalaryManagementProps {
  onBack?: () => void;
  onStaffUpdated?: (updatedStaff: Staff[]) => void;
  onOpenAddStaff?: () => void;
}

export const SalaryManagement: React.FC<SalaryManagementProps> = ({
  onBack,
  onStaffUpdated,
  onOpenAddStaff,
}) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "TEACHER" | "STAFF">("ALL");
  const [sortField, setSortField] = useState<"salary_desc" | "salary_asc" | "name">("salary_desc");

  // Edit Salary Modal State
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editSalary, setEditSalary] = useState<number>(500);
  const [editShiftHours, setEditShiftHours] = useState<ShiftDurationHours>(8);
  const [editLeaveQuota, setEditLeaveQuota] = useState<number>(18);
  const [editLeaveUsed, setEditLeaveUsed] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load staff on mount
  useEffect(() => {
    const list = loadStaffList();
    setStaffList(list);
  }, []);

  // Filtered & Sorted Staff List
  const filteredStaff = useMemo(() => {
    return staffList
      .filter((s) => {
        // Branch filter
        if (branchFilter !== "ALL" && s.branchId !== branchFilter) return false;
        // Category filter
        if (categoryFilter !== "ALL") {
          const cat = s.category || "STAFF";
          if (cat !== categoryFilter) return false;
        }
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchRole = s.role.toLowerCase().includes(q);
          const matchDept = (s.department || "").toLowerCase().includes(q);
          const matchSub = (s.subject || "").toLowerCase().includes(q);
          const matchBranch = (V2_BRANCHES[s.branchId]?.nameKhmer || "").toLowerCase().includes(q);
          if (!matchName && !matchRole && !matchDept && !matchSub && !matchBranch) {
            return false;
          }
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
  }, [staffList, branchFilter, categoryFilter, searchQuery, sortField]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalPayroll = staffList.reduce((sum, s) => sum + (s.baseSalary ?? 500), 0);
    const avgSalary = staffList.length > 0 ? Math.round(totalPayroll / staffList.length) : 0;
    const dailyPayroll = Math.round(totalPayroll / 26);
    const teachersCount = staffList.filter((s) => s.category === "TEACHER").length;
    const staffCount = staffList.filter((s) => s.category !== "TEACHER").length;

    return {
      totalPayroll,
      avgSalary,
      dailyPayroll,
      teachersCount,
      staffCount,
      totalCount: staffList.length,
    };
  }, [staffList]);

  // Open Edit Salary Sheet
  const handleOpenEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditSalary(staff.baseSalary ?? 500);
    setEditShiftHours(staff.shiftHours ?? 8);
    setEditLeaveQuota(staff.leaveQuota ?? 18);
    setEditLeaveUsed(staff.leaveUsed ?? 0);
  };

  // Save Salary Changes
  const handleSaveSalary = (e: React.FormEvent) => {
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
    setToastMessage(`បានកែប្រែប្រាក់ខែ "${selectedStaff.name}" ទៅជា $${newSalary} ជោគជ័យ!`);
    setTimeout(() => setToastMessage(null), 4000);
    setSelectedStaff(null);
  };

  // Export Salary to CSV
  const handleExportCSV = () => {
    if (staffList.length === 0) {
      alert("មិនមានទិន្នន័យដើម្បីទាញយករបាយការណ៍ប្រាក់ខែទេ");
      return;
    }

    const headers = [
      "ល.រ (No.)",
      "ឈ្មោះបុគ្គលិក (Staff Name)",
      "សាខា (Branch)",
      "តួនាទី (Role)",
      "ប្រភេទ (Category)",
      "មុខវិជ្ជា/ផ្នែក (Subject/Dept)",
      "វេលាធ្វើការ (Shift Hours)",
      "ប្រាក់ខែគោល (Base Salary $)",
      "ប្រាក់ខែ/ថ្ងៃ (Daily Rate $)",
      "ប្រាក់ខែ/ម៉ោង (Hourly Rate $)",
      "កូតាច្បាប់ AL សរុប (Days)",
      "ច្បាប់បានឈប់ (Days)",
      "ច្បាប់នៅសល់ (Days)",
      "លេខទូរស័ព្ទ (Phone)",
    ];

    const rows = staffList.map((s, idx) => {
      const branch = V2_BRANCHES[s.branchId]?.nameKhmer || s.branchId;
      const cat = s.category === "TEACHER" ? "គ្រូបង្រៀន" : "បុគ្គលិកទូទៅ";
      const shift = s.shiftHours ?? 8;
      const salary = s.baseSalary ?? 500;
      const dailyRate = (salary / 26).toFixed(2);
      const hourlyRate = (salary / 26 / shift).toFixed(2);
      const quota = s.leaveQuota ?? 18;
      const used = s.leaveUsed ?? 0;
      const remaining = Math.max(0, quota - used);

      return [
        `"${idx + 1}"`,
        `"${s.name}"`,
        `"${branch}"`,
        `"${s.role}"`,
        `"${cat}"`,
        `"${s.subject || s.department || "ទូទៅ"}"`,
        `"${shift} ម៉ោង/ថ្ងៃ"`,
        `"$${salary}"`,
        `"$${dailyRate}"`,
        `"$${hourlyRate}"`,
        `"${quota}"`,
        `"${used}"`,
        `"${remaining}"`,
        `"${s.phone || "-"}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `V2_Staff_Salary_Payroll_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-kantumruy animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-white" />
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
        <div className="flex items-center justify-between">
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
                <span>តារាងប្រាក់ខែបុគ្គលិក</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Payroll
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                បញ្ចូល កែប្រែ និងគ្រប់គ្រងប្រាក់ខែបុគ្គលិក និងគ្រូបង្រៀន
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold transition flex items-center gap-1.5"
              title="ទាញយកជា Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
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

        {/* 4 Apple/iOS Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. Total Monthly Payroll */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-3 rounded-2xl space-y-1">
            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>ចំណាយប្រាក់ខែសរុប</span>
              <DollarSign className="w-3 h-3" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-200">
              ${metrics.totalPayroll.toLocaleString()}
            </div>
            <div className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80">
              សរុបប្រចាំខែ (Monthly)
            </div>
          </div>

          {/* 2. Average Salary */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 p-3 rounded-2xl space-y-1">
            <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 flex items-center justify-between">
              <span>ប្រាក់ខែមធ្យម</span>
              <TrendingUp className="w-3 h-3" />
            </div>
            <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-200">
              ${metrics.avgSalary}
            </div>
            <div className="text-[9px] text-blue-600/80 dark:text-blue-400/80">
              មធ្យមភាគក្នុងម្នាក់
            </div>
          </div>

          {/* 3. Daily Payroll Total */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 p-3 rounded-2xl space-y-1">
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <span>ប្រាក់ខែសរុប/ថ្ងៃ</span>
              <Calculator className="w-3 h-3" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-900 dark:text-amber-200">
              ${metrics.dailyPayroll}
            </div>
            <div className="text-[9px] text-amber-600/80 dark:text-amber-400/80">
              គិតតាម ២៦ ថ្ងៃ/ខែ
            </div>
          </div>

          {/* 4. Staff Count */}
          <div className="bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 p-3 rounded-2xl space-y-1">
            <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 flex items-center justify-between">
              <span>បុគ្គលិកសរុប</span>
              <Users className="w-3 h-3" />
            </div>
            <div className="text-lg font-bold font-mono text-purple-900 dark:text-purple-200">
              {metrics.totalCount} នាក់
            </div>
            <div className="text-[9px] text-purple-600/80 dark:text-purple-400/80">
              គ្រូ {metrics.teachersCount} • បុគ្គលិក {metrics.staffCount}
            </div>
          </div>
        </div>

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
                  sortField === "salary_desc"
                    ? "salary_asc"
                    : sortField === "salary_asc"
                    ? "name"
                    : "salary_desc"
                )
              }
              className="px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900"
              title="តម្រៀបតាមប្រាក់ខែ / ឈ្មោះ"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold">
                {sortField === "salary_desc"
                  ? "$ ខ្ពស់ → ទាប"
                  : sortField === "salary_asc"
                  ? "$ ទាប → ខ្ពស់"
                  : "តាមឈ្មោះ (ក-អ)"}
              </span>
            </button>
          </div>
        </div>

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
            <span>គ្រូបង្រៀន ({metrics.teachersCount})</span>
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
            <span>បុគ្គលិកទូទៅ ({metrics.staffCount})</span>
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

      {/* Salary List / Table Container */}
      <div className="space-y-3">
        {filteredStaff.map((staff, index) => {
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
                    onClick={() => handleOpenEdit(staff)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-2xl transition flex items-center gap-1 text-xs font-bold font-battambang active:scale-95"
                    title="កែសម្រួលប្រាក់ខែ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">កែប្រែ</span>
                  </button>
                </div>
              </div>

              {/* 3 iOS Inset Metrics: Daily Rate, Hourly Rate, Shift & Leave Balance */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                {/* 1. Daily Rate */}
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
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

                {/* 2. Hourly Rate */}
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
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

                {/* 3. Leave Quota & Remaining */}
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
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

        {filteredStaff.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">មិនមានបុគ្គលិកត្រូវតាមការស្វែងរកឡើយ</p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* QUICK SALARY EDIT MODAL / DRAWER (iOS SHEET STYLE) */}
      {/* ========================================================= */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-battambang text-slate-900 dark:text-white">
                    កែប្រែប្រាក់ខែបុគ្គលិក
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

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSalary} className="p-5 space-y-4">
              {/* Dynamic Live Calculation Card */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
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

              {/* 2. Shift Hours (វេលាធ្វើការក្នុងមួយថ្ងៃ - 1-Tap Buttons) */}
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
