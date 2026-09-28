"use client";

import React, { useState } from "react";
import { AttendanceRecord, AttendanceType, Staff } from "@/types";
import { V2_BRANCHES } from "@/lib/branches";
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Zap,
  RotateCcw,
  User,
  Users,
  Building,
  Loader2,
} from "lucide-react";

interface AttendanceCardViewProps {
  records: AttendanceRecord[];
  staffList?: Staff[];
  currentStaff?: Staff;
  isAdmin?: boolean;
  onBack: () => void;
  onClockAction: (type: AttendanceType, staffId?: string) => void;
  onDirectRecord?: (type: AttendanceType, staff: Staff) => Promise<void>;
  onExportCsv?: () => void;
}

export const AttendanceCardView: React.FC<AttendanceCardViewProps> = ({
  records,
  staffList = [],
  currentStaff,
  isAdmin = true,
  onBack,
  onClockAction,
  onDirectRecord,
  onExportCsv,
}) => {
  // Staff Selection state
  const defaultStaffId = currentStaff?.id || (staffList.length > 0 ? staffList[0].id : "");
  const [selectedStaffId, setSelectedStaffId] = useState<string>(defaultStaffId);
  const [submittingAction, setSubmittingAction] = useState<AttendanceType | null>(null);
  const [filterScope, setFilterScope] = useState<"STAFF" | "ALL">("STAFF");

  // Selected staff object: strictly locked to currentStaff if not admin
  const activeStaff = !isAdmin
    ? (currentStaff || staffList.find((s) => !s.isAdmin) || staffList[0])
    : (staffList.find((s) => s.id === selectedStaffId) || currentStaff || staffList[0]);

  // Format today's date matching Image 2 (e.g., "21 September 2026")
  const today = new Date();
  const formattedToday = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Filter records for today and specifically for the active staff member
  const todayStaffRecords = records.filter((r) => {
    const d = new Date(r.timestamp);
    return (
      r.staffId === activeStaff.id &&
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const checkInRecord = todayStaffRecords.find((r) => r.type === "CHECK_IN");
  const checkOutRecord = todayStaffRecords.find((r) => r.type === "CHECK_OUT");

  const isCompleted = Boolean(checkInRecord && checkOutRecord);

  // Quick 1-tap handler
  const handleQuickTap = async (type: AttendanceType) => {
    if (!onDirectRecord) {
      onClockAction(type, activeStaff.id);
      return;
    }
    setSubmittingAction(type);
    try {
      await onDirectRecord(type, activeStaff);
    } finally {
      setSubmittingAction(null);
    }
  };

  // Filter historical records: locked to activeStaff if not admin
  const historicalRecords =
    !isAdmin || filterScope === "STAFF"
      ? records.filter((r) => r.staffId === activeStaff.id)
      : records;

  return (
    <div className="space-y-4 font-kantumruy">
      {/* Top Header Bar matching Image 2 */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-0.5 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <h2 className="text-base font-bold font-sans text-slate-900 dark:text-white">
          {isAdmin ? "Attendance" : "My Attendance"}
        </h2>

        {isAdmin && onExportCsv ? (
          <button
            type="button"
            onClick={onExportCsv}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
          >
            Report
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Active Staff Header with Avatar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800 shadow-2xs">
            {activeStaff.avatarUrl ? (
              <img
                src={activeStaff.avatarUrl}
                alt={activeStaff.name}
                className="w-full h-full object-cover"
              />
            ) : (
              activeStaff.name.slice(0, 2)
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white font-battambang truncate">
              {activeStaff.name}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              {activeStaff.role} • {V2_BRANCHES[activeStaff.branchId]?.nameKhmer || activeStaff.branchId}
            </p>
          </div>
        </div>

        {/* Staff Selector (Admin Only) */}
        {isAdmin && staffList.length > 0 && (
          <select
            value={activeStaff.id}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden max-w-[170px] truncate shrink-0"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Active Staff Info Strip */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shadow-2xs">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block">ប្រភេទ & ផ្នែក:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
            {activeStaff.category === "TEACHER" ? `👨‍🏫 ${activeStaff.subject || "គ្រូបង្រៀន"}` : `🏢 ${activeStaff.department || "បុគ្គលិក"}`}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block">វេនការងារ:</span>
          <span className="font-bold text-amber-600 truncate block">
            {activeStaff.shiftHours || 8} ម៉ោង/ថ្ងៃ
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block">លេខកូដសម្គាល់:</span>
          <span className="font-bold text-blue-600 font-mono truncate block">
            {activeStaff.code || activeStaff.id}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block">សមតុល្យច្បាប់ AI:</span>
          <span className="font-bold text-purple-600 font-mono truncate block">
            សល់ {(activeStaff.leaveQuota ?? 18) - (activeStaff.leaveUsed ?? 0)} ថ្ងៃ
          </span>
        </div>
      </div>

      {/* Primary Daily Attendance Card matching Image 2 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        {/* Date Header matching Image 2 */}
        <div className="text-lg font-bold text-slate-900 dark:text-white font-sans">
          {formattedToday}
        </div>

        {/* ========================================================= */}
        {/* Check-in Section */}
        {/* ========================================================= */}
        <div className="space-y-2">
          {/* Row 1: Bullet + Label + Status/Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans">
                Check-in :
              </span>
            </div>

            {/* Check-in Status or Action Buttons */}
            {checkInRecord ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                  {checkInRecord.punctuality.status === "LATE" ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block shadow-xs" />
                      <span className="text-rose-600 font-sans">Late</span>
                    </>
                  ) : (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block shadow-xs" />
                      <span className="text-slate-900 dark:text-white font-sans">Good</span>
                    </>
                  )}
                </span>
                {/* Rescan button */}
                <button
                  type="button"
                  onClick={() => onClockAction("CHECK_IN", activeStaff.id)}
                  title="ស្កេន Check-in ឡើងវិញ"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* 1-Tap Quick Check-In Button */}
                <button
                  type="button"
                  onClick={() => handleQuickTap("CHECK_IN")}
                  disabled={submittingAction !== null}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-battambang transition shadow-xs flex items-center gap-1 active:scale-95 disabled:opacity-50"
                >
                  {submittingAction === "CHECK_IN" ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>កត់ត្រា...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      <span>ចុច Check-in</span>
                    </>
                  )}
                </button>

                {/* Scan Camera QR Button */}
                <button
                  type="button"
                  onClick={() => onClockAction("CHECK_IN", activeStaff.id)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                  title="បើកកាមេរ៉ាស្កេន QR"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ស្កេន</span>
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Time line */}
          <div className="pl-5 text-sm font-bold text-slate-900 dark:text-white font-sans">
            Time : {checkInRecord ? checkInRecord.formattedTime : "--:-- --"}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Check-out Section */}
        {/* ========================================================= */}
        <div className="space-y-2">
          {/* Row 1: Bullet + Label + Status/Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-sans">
                Check-out :
              </span>
            </div>

            {/* Check-out Status or Action Buttons */}
            {checkOutRecord ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                  {checkOutRecord.punctuality.status === "EARLY_LEAVE" ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow-xs" />
                      <span className="text-amber-600 font-sans">Early</span>
                    </>
                  ) : (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block shadow-xs" />
                      <span className="text-slate-900 dark:text-white font-sans">Good</span>
                    </>
                  )}
                </span>
                {/* Rescan button */}
                <button
                  type="button"
                  onClick={() => onClockAction("CHECK_OUT", activeStaff.id)}
                  title="ស្កេន Check-out ឡើងវិញ"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-600 rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* 1-Tap Quick Check-Out Button */}
                <button
                  type="button"
                  onClick={() => handleQuickTap("CHECK_OUT")}
                  disabled={submittingAction !== null}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold font-battambang transition shadow-xs flex items-center gap-1 active:scale-95 disabled:opacity-50"
                >
                  {submittingAction === "CHECK_OUT" ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>កត់ត្រា...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      <span>ចុច Check-out</span>
                    </>
                  )}
                </button>

                {/* Scan Camera QR Button */}
                <button
                  type="button"
                  onClick={() => onClockAction("CHECK_OUT", activeStaff.id)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                  title="បើកកាមេរ៉ាស្កេន QR"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                  <span>ស្កេន</span>
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Time line */}
          <div className="pl-5 text-sm font-bold text-slate-900 dark:text-white font-sans">
            Time : {checkOutRecord ? checkOutRecord.formattedTime : "--:-- --"}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Bottom Status line matching Image 2 */}
        {/* ========================================================= */}
        <div className="pt-2 flex items-center gap-2.5">
          {isCompleted ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block shadow-sm" />
              <span className="text-sm font-bold text-slate-900 dark:text-white font-sans">
                Completed
              </span>
            </>
          ) : checkInRecord ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                Checked In
              </span>
              <span className="text-xs text-slate-400 font-kantumruy">
                (រង់ចាំ Check-out)
              </span>
            </>
          ) : (
            <>
              <span className="w-3.5 h-3.5 rounded-full bg-slate-300 inline-block" />
              <span className="text-sm font-semibold text-slate-500 font-sans">
                Not Checked In Yet
              </span>
            </>
          )}
        </div>
      </div>

      {/* Historical List Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterScope("STAFF")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterScope === "STAFF"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {activeStaff.name}
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterScope === "ALL"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ទាំងអស់ ({records.length})
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-800 dark:text-white font-battambang">
              វត្តមានរបស់ខ្ញុំ ({activeStaff.name})
            </span>
          )}

          <span className="text-[11px] text-slate-400 font-battambang">
            ប្រវត្តិវត្តមានកន្លងមក
          </span>
        </div>

        {historicalRecords.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            មិនទាន់មានកំណត់ត្រាវត្តមាននៅឡើយទេ
          </div>
        ) : (
          historicalRecords.slice(0, 10).map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:shadow-xs transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    record.type === "CHECK_IN"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/50"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-battambang">
                    {record.staffName} • {record.branchName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {record.formattedDate} • ម៉ោង {record.formattedTime}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    record.punctuality.status === "LATE"
                      ? "bg-rose-100 text-rose-700"
                      : record.punctuality.status === "EARLY_LEAVE"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {record.punctuality.status === "LATE"
                    ? "Late"
                    : record.punctuality.status === "EARLY_LEAVE"
                    ? "Early"
                    : "Good"}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {record.type === "CHECK_IN" ? "Check-in" : "Check-out"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
