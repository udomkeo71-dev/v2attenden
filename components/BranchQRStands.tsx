"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { BRANCH_LIST, V2_BRANCHES } from "@/lib/branches";
import { Branch } from "@/types";
import { Download, Printer, MapPin, Shield, CheckCircle2, QrCode as QrIcon } from "lucide-react";
import Image from "next/image";

export const BranchQRStands: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generate QR codes for all branches
    const generateAllQrs = async () => {
      const generated: Record<string, string> = {};
      for (const branch of BRANCH_LIST) {
        // Direct scan URL for staff mobile camera scanning (auto-detects domain)
        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "https://attendencv20.vercel.app";
        const payload = `${origin}?branch=${branch.id}&mode=scan`;

        try {
          const url = await QRCode.toDataURL(payload, {
            width: 320,
            margin: 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
            errorCorrectionLevel: "H",
          });
          generated[branch.id] = url;
        } catch (err) {
          console.error("Failed generating QR for", branch.id, err);
        }
      }
      setQrImages(generated);
    };

    generateAllQrs();
  }, []);

  const handleDownload = (branch: Branch) => {
    const dataUrl = qrImages[branch.id];
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `V2_QR_Stand_${branch.id}_${branch.nameEnglish.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const displayedBranches =
    selectedBranchId === "ALL"
      ? BRANCH_LIST
      : BRANCH_LIST.filter((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-6">
      {/* Top Controls (Hidden during print) */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white font-battambang flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-blue-600" />
            <span>កូដ QR សាខាទាំង ៧ (Branch QR Code Stands)</span>
          </h2>
          <p className="text-xs text-slate-500 font-kantumruy mt-0.5">
            ប័ណ្ណស្កេនវត្តមានប្រចាំសាខា អាចបោះពុម្ព (Print) ឬទាញយក (Download PNG) ដើម្បីដាក់តាំងមុខសាខា
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Branch Filter Selector */}
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-xs font-kantumruy font-medium px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">បង្ហាញសាខាទាំងអស់ (៧ សាខា)</option>
            {BRANCH_LIST.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameKhmer} ({b.id})
              </option>
            ))}
          </select>

          {/* Print All Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ព (Print)</span>
          </button>
        </div>
      </div>

      {/* Grid of Stand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedBranches.map((branch) => {
          const qrDataUrl = qrImages[branch.id];

          return (
            <div
              key={branch.id}
              className="qr-stand-card bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden flex flex-col font-kantumruy print:border print:shadow-none print-page-break"
            >
              {/* Standee Header */}
              <div
                className="p-5 text-white text-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${branch.color}, #0f172a)`,
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center">
                    <Image src="/v2_n.png" alt="V2" width={32} height={32} className="h-7 w-auto object-contain" />
                  </div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-semibold tracking-wider uppercase text-white">
                    V2 EDUCATION
                  </span>
                </div>
                <h3 className="text-xl font-bold font-battambang tracking-tight">
                  {branch.nameKhmer}
                </h3>
                <p className="text-xs text-white/80 font-medium">
                  {branch.nameEnglish}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] bg-black/20 px-2.5 py-0.5 rounded-md text-white/90">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{branch.addressKhmer}</span>
                </div>
                {branch.contactNumber && (
                  <div className="mt-1.5 text-[10px] text-white/85 flex items-center justify-center gap-1.5">
                    <span>☎️ {branch.contactNumber}</span>
                    {branch.facebookPage && <span>• 🌐 {branch.facebookPage}</span>}
                  </div>
                )}
              </div>

              {/* QR Code Presentation Box */}
              <div className="p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 flex-1">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  {qrDataUrl ? (
                    <Image
                      src={qrDataUrl}
                      alt={`${branch.nameKhmer} QR Code`}
                      width={220}
                      height={220}
                      className="rounded-lg"
                      priority
                    />
                  ) : (
                    <div className="w-[220px] h-[220px] bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      កំពុងបង្កើត QR...
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center space-y-1">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>ស្កេនកូដដើម្បីកត់ត្រាវត្តមានផ្ទាល់</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    GPS Geofence: <b>{branch.radiusMeters} ម៉ែត្រ</b> ជុំវិញទីតាំងនេះ
                  </div>
                </div>

                {/* GPS Coordinates Badge */}
                <div className="mt-3 text-[11px] font-mono text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-300/60 dark:border-slate-700">
                  Lat: {branch.latitude.toFixed(4)}, Lng: {branch.longitude.toFixed(4)}
                </div>
              </div>

              {/* Card Footer Actions (Hidden on Print) */}
              <div className="no-print p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>កូដមានសុពលភាព</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDownload(branch)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    title="ទាញយករូប QR"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition"
                    title="បោះពុម្ពប័ណ្ណនេះ"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
