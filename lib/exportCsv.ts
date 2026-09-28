import { AttendanceRecord } from "@/types";

export function exportAttendanceToCSV(records: AttendanceRecord[], filenamePrefix = "V2_Attendance_Report"): void {
  if (records.length === 0) {
    alert("មិនមានទិន្នន័យដើម្បីទាញយករបាយការណ៍ទេ");
    return;
  }

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

  const rows = records.map((r) => [
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

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
