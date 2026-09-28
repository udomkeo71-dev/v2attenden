"use client";

import React, { useState } from "react";
import { AttendanceRecord, BranchId } from "@/types";
import { BRANCH_LIST, V2_BRANCHES } from "@/lib/branches";
import { PunctualityBadge } from "./PunctualityBadge";
import {
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Calendar,
  Filter,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";
import Image from "next/image";

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  onClearRecords: () => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  records,
  onClearRecords,
}) => {
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesBranch = branchFilter === "ALL" || r.branchId === branchFilter;
    let matchesStatus = true;
    if (statusFilter === "ON_TIME") {
      matchesStatus = r.punctuality.status === "ON_TIME" || r.punctuality.status === "EARLY";
    } else if (statusFilter === "LATE") {
      matchesStatus = r.punctuality.status === "LATE";
    } else if (statusFilter === "EARLY_LEAVE") {
      matchesStatus = r.punctuality.status === "EARLY_LEAVE";
    } else if (statusFilter === "OUT_GEOFENCE") {
      matchesStatus = !r.geofence.isWithinGeofence;
    }
    return matchesBranch && matchesStatus;
  });

  // Calculate stats
  const totalCount = records.length;
  const onTimeCount = records.filter(
    (r) => r.punctuality.status === "ON_TIME" || r.punctuality.status === "EARLY"
  ).length;
  const lateCount = records.filter((r) => r.punctuality.status === "LATE").length;
  const outOfGeofenceCount = records.filter((r) => !r.geofence.isWithinGeofence).length;
  const onTimePercentage = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 100;

  // Export to CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      "ID",
      "កាលបរិច្ឆេទ (Date)",
      "ម៉ោង (Time)",
      "ប្រភេទ (Type)",
      "បុគ្គលិក (Staff)",
      "តួនាទី (Role)",
      "សាខា (Branch)",
      "ស្ថានភាពម៉ោង (Punctuality)",
      "GPS Geofence",
      "ចម្ងាយ (Meters)",
      "Google Maps URL",
      "ការផ្ទៀងផ្ទាត់ AI (Gemini)",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${r.formattedDate}"`,
      `"${r.formattedTime}"`,
      `"${r.type === "CHECK_IN" ? "ចូល (Check-In)" : "ចេញ (Check-Out)"}"`,
      `"${r.staffName}"`,
      `"${r.staffRole}"`,
      `"${r.branchName}"`,
      `"${r.punctuality.labelKhmer.replace(/[🟢🔵🔴🟠]/g, "").trim()}"`,
      `"${r.geofence.isWithinGeofence ? "ក្នុងបរិវេណ" : "ក្រៅបរិវេណ"}"`,
      `"${r.geofence.distanceMeters}"`,
      `"${r.geofence.googleMapsUrl}"`,
      `"${r.aiVerification.summaryKhmer.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `V2_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-kantumruy">
      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>វត្តមានសរុប</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-battambang text-slate-800 dark:text-white mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">កំណត់ត្រាទាំងអស់</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>ទាន់ម៉ោង / មកលឿន</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-battambang text-emerald-600 mt-1">
            {onTimePercentage}%
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">{onTimeCount} លើក</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>មកយឺត (Late)</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-battambang text-rose-600 mt-1">
            {lateCount}
          </div>
          <div className="text-[11px] text-rose-500/80 mt-0.5">លើសម៉ោងកំណត់</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>ក្រៅបរិវេណ GPS</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-battambang text-amber-600 mt-1">
            {outOfGeofenceCount}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-0.5">&gt; Radius សាខា</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            >
              <option value="ALL">សាខាទាំងអស់</option>
              {BRANCH_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          >
            <option value="ALL">ស្ថានភាពទាំងអស់</option>
            <option value="ON_TIME">🟢 ទាន់ម៉ោង / មកលឿន</option>
            <option value="LATE">🔴 មកយឺត</option>
            <option value="EARLY_LEAVE">🟠 ចេញមុន</option>
            <option value="OUT_GEOFENCE">⚠️ ក្រៅបរិវេណ GPS</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={() => {
                if (confirm("តើអ្នកចង់សម្អាតប្រវត្តវត្តមានទាំងអស់មែនទេ?")) {
                  onClearRecords();
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="សម្អាតប្រវត្ត"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ទាញយករបាយការណ៍ (Export CSV)</span>
          </button>
        </div>
      </div>

      {/* Attendance Table / Cards */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2.5" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 font-battambang">
            មិនទាន់មានទិន្នន័យវត្តមាននៅឡើយ
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            សូមចូលទៅកាន់ផ្ទាំង &quot;ស្កេនវត្តមាន&quot; ដើម្បីចាប់ផ្តើមស្កេនកត់ត្រាវត្តមានបុគ្គលិកដំបូងរបស់អ្នក!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">រូបថត</th>
                  <th className="px-4 py-3">បុគ្គលិក</th>
                  <th className="px-4 py-3">សាខា</th>
                  <th className="px-4 py-3">ពេលវេលា</th>
                  <th className="px-4 py-3">ស្ថានភាពម៉ោង</th>
                  <th className="px-4 py-3">GPS Geofence</th>
                  <th className="px-4 py-3">ការផ្ទៀងផ្ទាត់ AI</th>
                  <th className="px-4 py-3 text-right">Telegram</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {/* Photo thumbnail */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {record.photoBase64 ? (
                        <button
                          onClick={() => setSelectedPhoto(record.photoBase64 || null)}
                          className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition block group"
                        >
                          <Image
                            src={record.photoBase64}
                            alt={record.staffName}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                          គ្មានរូប
                        </div>
                      )}
                    </td>

                    {/* Staff info */}
                    <td className="px-4 py-3">
                      <div className="font-bold font-battambang text-slate-900 dark:text-white">
                        {record.staffName}
                      </div>
                      <div className="text-[11px] text-slate-400">{record.staffRole}</div>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {record.branchName}
                      </span>
                    </td>

                    {/* Time and date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {record.formattedTime}
                      </div>
                      <div className="text-[11px] text-slate-400">{record.formattedDate}</div>
                    </td>

                    {/* Punctuality Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PunctualityBadge punctuality={record.punctuality} size="sm" />
                    </td>

                    {/* GPS Distance & Maps link */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            record.geofence.isWithinGeofence
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {record.geofence.statusLabelKhmer}
                        </span>
                        <a
                          href={record.geofence.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition"
                          title="មើលលើ Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ចម្ងាយ: {record.geofence.distanceMeters} ម៉ែត្រ
                      </div>
                    </td>

                    {/* Gemini AI Note */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] line-clamp-2">
                          {record.aiVerification.summaryKhmer}
                        </span>
                      </div>
                    </td>

                    {/* Telegram Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                        <span>ផ្ញើរួចរាល់ ✓</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Photo View Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-3 max-w-sm w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-black">
              <Image
                src={selectedPhoto}
                alt="Enlarged snapshot"
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-3 text-center text-xs text-slate-400 font-kantumruy">
              រូបថតផ្ទៀងផ្ទាត់ដោយ Google Gemini AI
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
