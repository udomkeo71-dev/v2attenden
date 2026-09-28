"use client";

import React, { useState, useEffect } from "react";
import { Staff } from "@/types";
import { V2_BRANCHES } from "@/lib/branches";
import { X, QrCode, Download, ShieldCheck, Sparkles, Building } from "lucide-react";
import QRCode from "qrcode";
import Image from "next/image";

interface MyCardModalProps {
  isOpen: boolean;
  staff: Staff;
  onClose: () => void;
}

export const MyCardModal: React.FC<MyCardModalProps> = ({
  isOpen,
  staff,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !staff) return;

    const generateQr = async () => {
      try {
        const payload = `V2_STAFF:${staff.id}:${staff.name}:${staff.branchId}`;
        const url = await QRCode.toDataURL(payload, {
          width: 340,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Failed to generate staff card QR", err);
      }
    };

    generateQr();
  }, [isOpen, staff]);

  if (!isOpen) return null;

  const branch = V2_BRANCHES[staff.branchId];

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `V2_Card_${staff.name.replace(/\s+/g, "_")}_${staff.id}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Card Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
              <Image src="/v2_n.png" alt="V2" width={28} height={28} className="h-6 w-auto object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-battambang text-slate-900 dark:text-white">
                ប័ណ្ណកូដ QR វត្តមាន (My Card)
              </h3>
              <p className="text-[11px] text-slate-400">V2 Education Attendance Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 text-center space-y-4">
          {/* QR Code Container */}
          <div className="bg-slate-50 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 inline-block shadow-inner">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={staff.name}
                width={220}
                height={220}
                className="rounded-xl mx-auto shadow-xs"
                unoptimized
              />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center text-xs text-slate-400">
                កំពុងបង្កើត QR...
              </div>
            )}
          </div>

          {/* Employee Info & Photo */}
          <div className="space-y-2">
            <div className="flex flex-col items-center">
              {staff.avatarUrl ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-3 ring-indigo-500/30 shadow-md mb-2">
                  <img
                    src={staff.avatarUrl}
                    alt={staff.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center ring-3 ring-indigo-500/30 shadow-md mb-2">
                  {staff.name.slice(0, 2)}
                </div>
              )}
              <h4 className="font-bold text-lg font-battambang text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>{staff.name}</span>
                {staff.isAdmin && <span className="text-xs">👑</span>}
              </h4>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {staff.role}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-blue-500" />
                  <span>{branch?.nameKhmer || staff.branchId}</span>
                </span>
                <span>•</span>
                <span>{staff.shiftHours || 8} ម៉ោង/ថ្ងៃ ({staff.checkInTime} - {staff.checkOutTime})</span>
              </div>
            </div>

            {/* AI Leave & Code badges */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-left pt-1">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                <span className="text-slate-400 block text-[10px]">លេខកូដសម្គាល់:</span>
                <span className="font-bold font-mono text-blue-600">{staff.code || staff.id}</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                <span className="text-slate-400 block text-[10px]">កូតាច្បាប់ AI:</span>
                <span className="font-bold font-mono text-purple-600">សល់ {(staff.leaveQuota ?? 18) - (staff.leaveUsed ?? 0)} ថ្ងៃ</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-800 dark:text-indigo-300">
            🎯 បង្ហាញកូដ QR នេះទៅកាន់កាមេរ៉ាស្កេនដើម្បីកត់ត្រាវត្តមានភ្លាមៗ
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយក PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition"
            >
              បិទ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
