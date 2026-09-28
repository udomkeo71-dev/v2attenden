import React from "react";
import { AttendanceRecord } from "@/types";
import { Send, X, ExternalLink, ShieldCheck, MapPin } from "lucide-react";
import Image from "next/image";

interface TelegramPreviewModalProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isSimulated?: boolean;
}

export const TelegramPreviewModal: React.FC<TelegramPreviewModalProps> = ({
  record,
  isOpen,
  onClose,
  isSimulated = false,
}) => {
  if (!isOpen || !record) return null;

  const mapsUrl = `https://maps.google.com/?q=${record.userCoords.latitude.toFixed(6)},${record.userCoords.longitude.toFixed(6)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white font-kantumruy">
        {/* Telegram Header */}
        <div className="bg-[#1c2733] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Send className="w-5 h-5 -ml-0.5" />
            </div>
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <span>V2 Attendance Alert Bot</span>
                <span className="bg-sky-500/20 text-sky-400 text-[10px] px-1.5 py-0.2 rounded">BOT</span>
              </div>
              <p className="text-xs text-slate-400">V2 Education Group Notification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner if simulated */}
        {isSimulated && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
            <span>ℹ️</span>
            <span>នេះជាផ្ទាំង Preview សារ Telegram (ដើម្បីផ្ញើទៅ Group ពិត សូមកំណត់ Token ក្នុង Settings)</span>
          </div>
        )}

        {/* Chat Body */}
        <div className="p-4 bg-[#0e1621] max-h-[75vh] overflow-y-auto space-y-3">
          {/* Message Bubble */}
          <div className="bg-[#182533] border border-slate-700/60 rounded-xl rounded-tl-xs p-3 shadow-lg max-w-[95%] space-y-2.5">
            {/* Captured Photo */}
            {record.photoBase64 && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-700/80 bg-black">
                <Image
                  src={record.photoBase64}
                  alt="Staff photo"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Branch QR</span>
                </div>
              </div>
            )}

            {/* Caption HTML Formatted */}
            <div className="text-xs sm:text-sm space-y-1.5 leading-relaxed text-slate-200">
              <div className="font-bold text-sm text-emerald-400 pb-1 border-b border-slate-700/60">
                {record.type === "CHECK_IN"
                  ? "🟢 វត្តមានចូលបម្រើការងារ (Check-In)"
                  : "🟠 វត្តមានចេញពីការងារ (Check-Out)"}
              </div>

              {/* Scanned Branch Confirmation Box */}
              <div className="bg-sky-950/60 border border-sky-500/40 p-2.5 rounded-xl">
                <div className="text-[11px] text-sky-400 font-bold">🏫 បញ្ជាក់សាខាស្កេនវត្តមាន៖</div>
                <div className="font-bold text-sm text-white font-battambang mt-0.5">
                  {record.branchName} ({record.branchId})
                </div>
              </div>

              <div className="pt-1 space-y-1">
                <div>
                  <span className="text-slate-400">👤 ឈ្មោះបុគ្គលិក: </span>
                  <span className="font-semibold text-white">{record.staffName}</span>
                </div>
                <div>
                  <span className="text-slate-400">💼 តួនាទី: </span>
                  <span className="text-slate-300">{record.staffRole}</span>
                </div>
                <div>
                  <span className="text-slate-400">⏰ ពេលវេលា: </span>
                  <span className="font-mono text-white">{record.formattedTime}</span>{" "}
                  <span className="text-slate-400">({record.formattedDate})</span>
                </div>
                <div>
                  <span className="text-slate-400">🚦 ស្ថានភាពម៉ោង: </span>
                  <span className="font-semibold">{record.punctuality.labelKhmer}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">📍 ទីតាំង GPS: </span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline inline-flex items-center gap-0.5"
                  >
                    <span>មើលលើ Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-400">📏 ចម្ងាយ: </span>
                  <span className="font-medium text-white">{record.geofence.distanceMeters} ម៉ែត្រ </span>
                  <span className="text-slate-300">({record.geofence.statusLabelKhmer})</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-md border border-slate-700/50 mt-1">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1 mb-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>វិធីសាស្ត្រផ្ទៀងផ្ទាត់:</span>
                  </div>
                  <div className="text-emerald-300 text-xs font-medium">
                    ស្កេនកូដ QR សាខាផ្លូវការ ({record.branchId}) • {record.geofence.statusLabelKhmer}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-right text-slate-400 pt-1">
                {record.formattedTime.substring(0, 5)} ✓✓
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1c2733] px-4 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
          >
            យល់ព្រម (បិទ)
          </button>
        </div>
      </div>
    </div>
  );
};
