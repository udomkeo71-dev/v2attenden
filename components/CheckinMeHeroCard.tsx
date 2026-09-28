"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Staff, BranchId } from "@/types";
import { V2_BRANCHES } from "@/lib/branches";
import {
  QrCode,
  Sparkles,
  Clock,
  MapPin,
  Crown,
  ShieldCheck,
  Zap,
  Calendar,
} from "lucide-react";

interface CheckinMeHeroCardProps {
  currentStaff?: Staff;
  currentBranchId?: BranchId;
  isAdmin?: boolean;
  onOpenMyCard: () => void;
  onQuickScan?: () => void;
}

export const CheckinMeHeroCard: React.FC<CheckinMeHeroCardProps> = ({
  currentStaff,
  currentBranchId = "BKK",
  isAdmin = false,
  onOpenMyCard,
  onQuickScan,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const branch = V2_BRANCHES[currentStaff?.branchId || currentBranchId || "BKK"];

  // Greeting by hour
  const hour = currentTime.getHours();
  let greetingKhmer = "ទិវាសួស្តី";
  let greetingIcon = "☀️";
  if (hour < 12) {
    greetingKhmer = "អរុណសួស្តី";
    greetingIcon = "🌅";
  } else if (hour >= 18) {
    greetingKhmer = "សាយណ្ហសួស្តី";
    greetingIcon = "🌙";
  }

  // Formatted Khmer Date
  const dateStr = currentTime.toLocaleDateString("km-KH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Time string
  const timeStr = currentTime.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Shift progress calculation
  let shiftProgressPercent = 50;
  if (currentStaff?.checkInTime && currentStaff?.checkOutTime) {
    try {
      const [inH, inM] = currentStaff.checkInTime.split(":").map(Number);
      const [outH, outM] = currentStaff.checkOutTime.split(":").map(Number);
      const inMinutes = inH * 60 + inM;
      const outMinutes = outH * 60 + outM;
      const nowMinutes = hour * 60 + currentTime.getMinutes();

      if (nowMinutes < inMinutes) {
        shiftProgressPercent = 0;
      } else if (nowMinutes > outMinutes) {
        shiftProgressPercent = 100;
      } else {
        const total = outMinutes - inMinutes;
        const current = nowMinutes - inMinutes;
        shiftProgressPercent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
      }
    } catch {
      shiftProgressPercent = 50;
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 shadow-xl border border-white/10 font-kantumruy transition hover:shadow-2xl">
      {/* Background Decorative Mesh & Watermark */}
      <div className="absolute -right-6 -bottom-8 text-white/5 text-9xl font-black select-none pointer-events-none tracking-tighter">
        V2
      </div>
      <div className="absolute -top-24 -left-24 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row: Brand Identity & Active Branch Pill */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 ring-2 ring-white/20">
            <Image
              src="/v2_n.png"
              alt="V2 Education"
              width={36}
              height={36}
              className="h-7 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide font-sans text-white uppercase">
                V2 Education
              </span>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-blue-200/80 font-battambang">
              ផ្ទះគ្រូបង្រៀនគំរូ • វត្តមានស្វ័យប្រវត្ត
            </div>
          </div>
        </div>

        {/* Location / Geofence Status Pill */}
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[10px] shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-emerald-300">
            {branch?.nameKhmer || "សាខា"}
          </span>
          <span className="text-white/40">•</span>
          <span className="text-slate-300 font-mono text-[9px]">&le;100m</span>
        </div>
      </div>

      {/* Hero Body: Greeting, Name, Live Clock & Shift Status */}
      <div className="relative z-10 pt-4 pb-2 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Staff Avatar Profile */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 ring-2 ring-white/20 shadow-md flex items-center justify-center font-bold text-lg text-white shrink-0 overflow-hidden backdrop-blur-xs">
              {currentStaff?.avatarUrl ? (
                <img
                  src={currentStaff.avatarUrl}
                  alt={currentStaff.name}
                  className="w-full h-full object-cover"
                />
              ) : isAdmin ? (
                <Crown className="w-7 h-7 text-amber-300" />
              ) : (
                <span className="font-battambang">
                  {currentStaff?.name ? currentStaff.name.slice(0, 2) : "V2"}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-blue-200">
                <span>{greetingIcon}</span>
                <span className="font-battambang">{greetingKhmer},</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-battambang tracking-tight text-white flex items-center gap-2">
                <span>{currentStaff ? currentStaff.name : "Admin ធំ"}</span>
                {isAdmin && (
                  <span className="text-[11px] bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-sans font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Super Admin</span>
                  </span>
                )}
              </h2>
              <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                <span className="text-blue-300 font-medium">
                  {currentStaff?.role || "អភិបាលប្រព័ន្ធជាន់ខ្ពស់"}
                </span>
                <span className="text-white/30">•</span>
                <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md text-amber-200 font-bold">
                  {currentStaff?.code || "V2-ADMIN"}
                </span>
              </div>
            </div>
          </div>

          {/* Live Digital Clock Widget */}
          <div className="text-right shrink-0 bg-white/5 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-inner">
            <div className="text-base sm:text-lg font-black font-mono tracking-tight text-white flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{timeStr}</span>
            </div>
            <div className="text-[9.5px] text-blue-200/70 font-sans mt-0.5">
              {dateStr}
            </div>
          </div>
        </div>

        {/* Live Work Shift Progress Strip */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-blue-200 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-blue-300" />
              <span>វេលាធ្វើការថ្ងៃនេះ៖</span>
              <b className="font-mono text-white">
                {currentStaff?.checkInTime || "07:30"} - {currentStaff?.checkOutTime || "17:00"}
              </b>
            </span>
            <span className="font-mono text-[10px] text-amber-300 font-bold">
              {shiftProgressPercent}% រួចរាល់
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-400 h-full transition-all duration-1000 rounded-full"
              style={{ width: `${shiftProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Action Footer: 2 Action Buttons */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* AI Leave Quota Chip */}
          <div className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-400/30 text-[10px] text-purple-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-300" />
            <span>ច្បាប់សល់៖</span>
            <b className="text-white font-mono">
              {(currentStaff?.leaveQuota ?? 18) - (currentStaff?.leaveUsed ?? 0)}
            </b>
            <span>ថ្ងៃ</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-xl border border-emerald-400/30">
            <ShieldCheck className="w-3 h-3" />
            <span>GPS ជាប់ជានិច្ច</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onQuickScan && (
            <button
              type="button"
              onClick={onQuickScan}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold font-battambang shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>ស្កេនឥឡូវ</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMyCard}
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold font-battambang shadow-sm hover:shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>កាត QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
