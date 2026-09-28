"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { AttendanceRecord, BranchId, Staff } from "@/types";
import { BRANCH_LIST, V2_BRANCHES } from "@/lib/branches";
import { formatDailyAccountingTelegramReport } from "@/lib/telegram";
import { loadSettings } from "@/lib/storage";
import { soundEffects } from "@/lib/audio";
import {
  FileText,
  Send,
  Download,
  Printer,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
} from "lucide-react";

interface DailyAccountingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  staffList: Staff[];
  currentBranchId?: BranchId;
}

export const DailyAccountingReportModal: React.FC<DailyAccountingReportModalProps> = ({
  isOpen,
  onClose,
  records,
  staffList,
  currentBranchId,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Today's date string
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const [filterDate, setFilterDate] = useState<string>(todayStr);

  if (!isOpen) return null;

  // Filter staff by branch if not ALL
  const filteredStaff = staffList.filter((s) => {
    if (selectedBranch === "ALL") return true;
    return s.branchId === selectedBranch;
  });

  // Filter records by date and branch
  const dateRecords = records.filter((r) => {
    const isSameDate =
      r.formattedDate === filterDate ||
      new Date(r.timestamp).toLocaleDateString("en-GB") === filterDate;
    if (!isSameDate) return false;
    if (selectedBranch !== "ALL" && r.branchId !== selectedBranch) return false;
    return true;
  });

  // Build paired records for every staff member
  const accountingRows = filteredStaff.map((staff) => {
    const staffRecords = dateRecords.filter((r) => r.staffId === staff.id);
    const checkIn = staffRecords
      .filter((r) => r.type === "CHECK_IN")
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
    const checkOut = staffRecords
      .filter((r) => r.type === "CHECK_OUT")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    let durationHours = 0;
    if (checkIn && checkOut) {
      const ms = new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime();
      durationHours = parseFloat((ms / (1000 * 60 * 60)).toFixed(1));
    }

    return {
      staff,
      checkIn,
      checkOut,
      durationHours,
      hasAttended: Boolean(checkIn || checkOut),
    };
  });

  // Calculate statistics
  const totalStaffCount = filteredStaff.length;
  const presentCount = accountingRows.filter((r) => r.hasAttended).length;
  const onTimeCount = accountingRows.filter(
    (r) => r.checkIn && (r.checkIn.punctuality.status === "ON_TIME" || r.checkIn.punctuality.status === "EARLY")
  ).length;
  const lateCount = accountingRows.filter((r) => r.checkIn && r.checkIn.punctuality.status === "LATE").length;
  const checkedOutCount = accountingRows.filter((r) => r.checkOut).length;
  const absentCount = totalStaffCount - presentCount;

  // Handle Send to Telegram
  const handleSendToTelegram = async () => {
    setIsSendingTelegram(true);
    setToastMessage(null);
    const settings = loadSettings();

    const branchNameFilter =
      selectedBranch === "ALL" ? undefined : V2_BRANCHES[selectedBranch as BranchId]?.nameKhmer;

    const messageHtml = formatDailyAccountingTelegramReport({
      dateStr: filterDate,
      records: dateRecords,
      staffList: filteredStaff,
      branchNameFilter,
    });

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          message: messageHtml,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccess(true);
        soundEffects.playSuccess();
        if (typeof window !== "undefined") {
          localStorage.setItem("v2_last_nightly_report_date", filterDate);
        }
        setToastMessage("✅ បានទម្លាក់របាយការណ៍ម៉ោង ៩:០០ យប់ ចូល Telegram ជោគជ័យ!");
        setTimeout(() => setSendSuccess(false), 5000);
      } else {
        soundEffects.playWarning();
        setToastMessage("⚠️ " + (data.error || "មិនអាចផ្ញើទៅ Telegram បានទេ សូមពិនិត្យ Bot Token"));
      }
    } catch {
      soundEffects.playError();
      setToastMessage("❌ មានបញ្ហាបច្ចេកវិទ្យាក្នុងការតភ្ជាប់ Telegram");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Handle Export Accounting CSV
  const handleExportAccountingCSV = () => {
    soundEffects.playClick();
    const headers = [
      "ល.រ (No)",
      "កាលបរិច្ឆេទ (Date)",
      "សាខា (Branch)",
      "ឈ្មោះបុគ្គលិក (Staff Name)",
      "តួនាទី (Role)",
      "លេខទូរស័ព្ទ (Phone)",
      "ម៉ោងចូល (Check-In)",
      "ស្ថានភាពចូល (In Status)",
      "ម៉ោងចេញ (Check-Out)",
      "ស្ថានភាពចេញ (Out Status)",
      "ម៉ោងធ្វើការសរុប (Hours Worked)",
      "GPS ក្នុងបរិវេណ (<= 100m)",
      "ស្ថានភាពទូទៅ (Overall Status)",
    ];

    const rows = accountingRows.map((row, idx) => {
      const inTime = row.checkIn ? row.checkIn.formattedTime : "គ្មានស្កេនចូល";
      const inStatus = row.checkIn ? row.checkIn.punctuality.labelKhmer.replace(/[🟢🔵🔴🟠]/g, "").trim() : "-";
      const outTime = row.checkOut ? row.checkOut.formattedTime : "មិនទាន់ស្កេនចេញ";
      const outStatus = row.checkOut ? row.checkOut.punctuality.labelKhmer.replace(/[🟢🔵🔴🟠]/g, "").trim() : "-";
      const hours = row.durationHours > 0 ? `${row.durationHours} ម៉ោង` : "-";
      const gpsOk = row.checkIn?.geofence.isWithinGeofence ? "ក្នុងបរិវេណ <= 100m" : "ក្រៅបរិវេណ";
      const overall = !row.hasAttended ? "អវត្តមាន" : row.checkOut ? "ចប់វេនការងារ" : "កំពុងធ្វើការ";

      return [
        `"${idx + 1}"`,
        `"${filterDate}"`,
        `"${row.staff.branchId}"`,
        `"${row.staff.name}"`,
        `"${row.staff.role || "បុគ្គលិក"}"`,
        `"${row.staff.phone || "-"}"`,
        `"${inTime}"`,
        `"${inStatus}"`,
        `"${outTime}"`,
        `"${outStatus}"`,
        `"${hours}"`,
        `"${gpsOk}"`,
        `"${overall}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanDate = filterDate.replace(/\//g, "-");
    link.setAttribute("download", `V2_Accounting_Attendance_${cleanDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Print PDF
  const handlePrintPDF = () => {
    soundEffects.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-kantumruy overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex items-center justify-between shrink-0 print:bg-white print:text-black print:border-b-2 print:border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <FileText className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-battambang leading-tight">
                  របាយការណ៍វត្តមានប្រចាំថ្ងៃ (សម្រាប់គណនេយ្យ)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  ម៉ោង ៩:០០ យប់
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                ស្រង់ទិន្នន័យស្កេនចេញ-ចូលបុគ្គលិក ផ្ទៀងផ្ទាត់ GPS 100m សម្រាប់ផ្នែកគណនេយ្យ & រដ្ឋបាល
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition print:hidden"
            title="បិទ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar (Hidden on Print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs">
              <Building className="w-4 h-4 text-blue-600" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">🏢 គ្រប់សាខាទាំងអស់ (៧ សាខា)</option>
                {BRANCH_LIST.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameKhmer} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="text"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 w-24 focus:outline-hidden"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            {/* Telegram 9 PM Dispatch Button */}
            <button
              type="button"
              onClick={handleSendToTelegram}
              disabled={isSendingTelegram}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition disabled:opacity-50"
              title="ទម្លាក់របាយការណ៍ម៉ោង ៩ យប់ ចូល Telegram ភ្លាមៗ"
            >
              {isSendingTelegram ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-amber-200" />
              )}
              <span>ទម្លាក់ចូល Telegram (៩ យប់)</span>
            </button>

            {/* Export Excel / CSV */}
            <button
              type="button"
              onClick={handleExportAccountingCSV}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition"
              title="ទាញយកជា Excel/CSV សម្រាប់គណនេយ្យ"
            >
              <Download className="w-4 h-4" />
              <span>Excel/CSV</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
              title="បោះពុម្ព ឬរក្សាទុកជា PDF"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Toast Alert Message */}
        {toastMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 font-bold flex items-center justify-between shrink-0 print:hidden">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body / Printable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 print:p-0 print:overflow-visible">
          {/* Printable Official Header */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 relative">
                <Image
                  src="/v2_n.png"
                  alt="V2 Logo"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold font-battambang text-slate-900">
                  សាលារៀន វីធូ អេឌ្យូខេសិន (V2 EDUCATION)
                </h1>
                <p className="text-xs text-slate-600">
                  របាយការណ៍កត់ត្រាវត្តមានបុគ្គលិកចេញ-ចូលផ្លូវការ (សម្រាប់ផ្នែកគណនេយ្យ)
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold">កាលបរិច្ឆេទ៖ {filterDate}</div>
              <div className="text-slate-500">ម៉ោងស្រង់របាយការណ៍៖ 21:00 (៩ យប់)</div>
              <div className="text-blue-600 font-bold">
                {selectedBranch === "ALL" ? "គ្រប់សាខាទាំងអស់" : selectedBranch}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 print:grid-cols-5">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-[11px] text-slate-500 font-medium">បុគ្គលិកសរុប</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {totalStaffCount} នាក់
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">វត្តមានមកធ្វើការ</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {presentCount} នាក់
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200 dark:border-blue-800 text-center">
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">ចូលទាន់ម៉ោង</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                {onTimeCount} នាក់
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
              <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">ចូលយឺត</div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                {lateCount} នាក់
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl border border-rose-200 dark:border-rose-800 text-center">
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">អវត្តមាន / មិនស្កេន</div>
              <div className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                {absentCount} នាក់
              </div>
            </div>
          </div>

          {/* Accounting Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs print:border-slate-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-battambang text-slate-800 dark:text-slate-200 font-bold">
                    <th className="py-2.5 px-3 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-3">បុគ្គលិក & តួនាទី</th>
                    <th className="py-2.5 px-3 text-center">សាខា</th>
                    <th className="py-2.5 px-3">🟢 ស្កេនចូល (In)</th>
                    <th className="py-2.5 px-3">🟠 ស្កេនចេញ (Out)</th>
                    <th className="py-2.5 px-3 text-center">ម៉ោងធ្វើការ</th>
                    <th className="py-2.5 px-3 text-center">GPS 100m</th>
                    <th className="py-2.5 px-3 text-center">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {accountingRows.map((row, idx) => {
                    const inTime = row.checkIn ? row.checkIn.formattedTime : null;
                    const outTime = row.checkOut ? row.checkOut.formattedTime : null;

                    return (
                      <tr
                        key={row.staff.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                          !row.hasAttended ? "bg-rose-50/30 dark:bg-rose-950/10" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{row.staff.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {row.staff.code || row.staff.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {row.staff.role || "បុគ្គលិក"} • {row.staff.phone || "-"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                            {row.staff.branchId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {inTime ? (
                            <div>
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {inTime}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {row.checkIn?.punctuality.labelKhmer}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-500 font-semibold text-[11px]">
                              ❌ គ្មានស្កេនចូល
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {outTime ? (
                            <div>
                              <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                                {outTime}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {row.checkOut?.punctuality.labelKhmer}
                              </div>
                            </div>
                          ) : row.checkIn ? (
                            <span className="text-amber-600 font-medium text-[11px]">
                              ⏳ មិនទាន់ស្កេនចេញ
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {row.durationHours > 0 ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                              {row.durationHours} h
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {row.checkIn ? (
                            <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>≤100m</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {!row.hasAttended ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              អវត្តមាន
                            </span>
                          ) : row.checkOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              រួចរាល់
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              កំពុងធ្វើការ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Signature Section for Accounting */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-10 mt-6 text-center text-xs">
            <div>
              <div className="font-bold text-slate-800">អ្នកស្រង់ទិន្នន័យ (រដ្ឋបាល)</div>
              <div className="h-20" />
              <div className="border-t border-slate-400 pt-1 font-medium">ហត្ថលេខា & ឈ្មោះ</div>
            </div>
            <div>
              <div className="font-bold text-slate-800">គណនេយ្យករ (Accountant)</div>
              <div className="h-20" />
              <div className="border-t border-slate-400 pt-1 font-medium">ហត្ថលេខា & ឈ្មោះ</div>
            </div>
            <div>
              <div className="font-bold text-slate-800">នាយកប្រតិបត្តិ / សាខា (Director)</div>
              <div className="h-20" />
              <div className="border-t border-slate-400 pt-1 font-medium">ហត្ថលេខា & ត្រា</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 print:hidden text-xs">
          <div className="text-slate-500">
            📊 រាល់ទិន្នន័យត្រូវបានកត់ត្រាច្បាស់លាស់ យុត្តិធម៌ និងមានសុវត្ថិភាពខ្ពស់
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition"
          >
            បិទផ្ទាំងនេះ
          </button>
        </div>
      </div>
    </div>
  );
};
