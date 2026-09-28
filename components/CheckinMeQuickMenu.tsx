"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Clock,
  Calendar,
  ChevronRight,
  MessageSquareText,
  DollarSign,
  QrCode,
  Sparkles,
  Zap,
  LayoutGrid,
  List,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { soundEffects } from "@/lib/audio";
import { Staff } from "@/types";

interface CheckinMeQuickMenuProps {
  onSelectMenu: (menu: "ATTENDANCE" | "LEAVE" | "CLOCK" | "CALENDAR" | "SALARY") => void;
  isAdmin?: boolean;
  currentStaff?: Staff;
}

export const CheckinMeQuickMenu: React.FC<CheckinMeQuickMenuProps> = ({
  onSelectMenu,
  isAdmin = true,
  currentStaff,
}) => {
  const [viewMode, setViewMode] = useState<"BENTO" | "LIST">("BENTO");

  const quotaRemaining = (currentStaff?.leaveQuota ?? 18) - (currentStaff?.leaveUsed ?? 0);

  const handleAction = (menu: "ATTENDANCE" | "LEAVE" | "CLOCK" | "CALENDAR" | "SALARY") => {
    soundEffects.playClick();
    onSelectMenu(menu);
  };

  return (
    <div className="space-y-2.5 font-kantumruy">
      {/* Section Header with View Toggle (Bento Grid vs List) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-sm font-bold font-battambang text-slate-800 dark:text-white">
            មុខងារចម្បង (Quick Actions)
          </h3>
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setViewMode("BENTO");
            }}
            className={`px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] font-semibold ${
              viewMode === "BENTO"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
            title="ក្រឡា Bento ទំនើប"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ក្រឡា</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setViewMode("LIST");
            }}
            className={`px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] font-semibold ${
              viewMode === "LIST"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
            title="បញ្ជីរាយ"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">បញ្ជី</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: FLAGSHIP BENTO GRID (2x2 Dynamic Cards) */}
      {/* ========================================================= */}
      {viewMode === "BENTO" ? (
        <div className="grid grid-cols-2 gap-2.5">
          {/* Bento Card 1: ស្កេនវត្តមាន QR (Clock Attendance) */}
          <div
            onClick={() => handleAction("CLOCK")}
            className="group relative cursor-pointer overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] flex flex-col justify-between min-h-[145px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition duration-300">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-white/20 backdrop-blur-md text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-white/20">
                &le; 100m
              </span>
            </div>

            <div className="space-y-1 mt-3">
              <div className="text-[15px] font-bold font-battambang leading-tight text-white flex items-center gap-1">
                <span>ស្កេនវត្តមាន QR</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition" />
              </div>
              <div className="text-[11px] text-emerald-100 font-kantumruy">
                ស្កេនចូល ឬចេញតាមសាខា
              </div>
            </div>

            {/* Quick 1-tap fast buttons inside card */}
            <div className="pt-2 mt-1 border-t border-white/15 flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-white">
                ⚡ ចូល
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-white">
                ⚡ ចេញ
              </span>
            </div>
          </div>

          {/* Bento Card 2: សុំច្បាប់សម្រាក (Leave Request) */}
          <div
            onClick={() => handleAction("LEAVE")}
            className="group relative cursor-pointer overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] flex flex-col justify-between min-h-[145px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition duration-300">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-white/20 backdrop-blur-md text-blue-100 font-bold px-2 py-0.5 rounded-full border border-white/20">
                សល់ {quotaRemaining} ថ្ងៃ
              </span>
            </div>

            <div className="space-y-1 mt-3">
              <div className="text-[15px] font-bold font-battambang leading-tight text-white flex items-center gap-1">
                <span>សុំច្បាប់សម្រាក</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition" />
              </div>
              <div className="text-[11px] text-blue-100 font-kantumruy">
                ទម្រង់ផ្លូវការ & ហត្ថលេខា
              </div>
            </div>

            <div className="pt-2 mt-1 border-t border-white/15 flex items-center gap-1 text-[10px] text-blue-100 font-medium">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>កូតា AI: {quotaRemaining} ថ្ងៃសល់</span>
            </div>
          </div>

          {/* Bento Card 3: វត្តមាន & កំណត់ត្រា (Attendance Card) */}
          <div
            onClick={() => handleAction("ATTENDANCE")}
            className="group relative cursor-pointer overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] flex flex-col justify-between min-h-[145px]"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition duration-300">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] bg-white/20 backdrop-blur-md text-amber-100 font-bold px-2 py-0.5 rounded-full border border-white/20">
                កាតលម្អិត
              </span>
            </div>

            <div className="space-y-1 mt-3">
              <div className="text-[15px] font-bold font-battambang leading-tight text-white flex items-center gap-1">
                <span>{isAdmin ? "វត្តមានបុគ្គលិក" : "វត្តមានផ្ទាល់ខ្លួន"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition" />
              </div>
              <div className="text-[11px] text-amber-100 font-kantumruy">
                {isAdmin ? "គ្រប់សាខា & Export CSV" : "ប្រវត្តិចេញចូល & ភាពទៀងទាត់"}
              </div>
            </div>

            <div className="pt-2 mt-1 border-t border-white/15 flex items-center gap-1 text-[10px] text-amber-100 font-medium">
              <Clock className="w-3 h-3 text-white" />
              <span>ម៉ោងពិតជាក់ស្តែង</span>
            </div>
          </div>

          {/* Bento Card 4: Role-Based Feature (Salary for Admin VS Calendar for Staff) */}
          {isAdmin ? (
            <div
              onClick={() => handleAction("SALARY")}
              className="group relative cursor-pointer overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] flex flex-col justify-between min-h-[145px]"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition duration-300">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  Admin ធំ
                </span>
              </div>

              <div className="space-y-1 mt-3">
                <div className="text-[15px] font-bold font-battambang leading-tight text-white flex items-center gap-1">
                  <span>តារាងប្រាក់ខែ</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[11px] text-purple-100 font-kantumruy">
                  បញ្ជីប្រាក់ខែដាច់ដោយឡែក
                </div>
              </div>

              <div className="pt-2 mt-1 border-t border-white/15 flex items-center gap-1 text-[10px] text-purple-100 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>គ្រប់គ្រង ៧ សាខា</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleAction("CALENDAR")}
              className="group relative cursor-pointer overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-700 text-white shadow-md shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] flex flex-col justify-between min-h-[145px]"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition duration-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-white/20 backdrop-blur-md text-purple-100 font-bold px-2 py-0.5 rounded-full border border-white/20">
                  កាលវិភាគ
                </span>
              </div>

              <div className="space-y-1 mt-3">
                <div className="text-[15px] font-bold font-battambang leading-tight text-white flex items-center gap-1">
                  <span>ប្រតិទិនការងារ</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[11px] text-purple-100 font-kantumruy">
                  វេនម៉ោង {currentStaff?.checkInTime || "07:30"} - {currentStaff?.checkOutTime || "17:00"}
                </div>
              </div>

              <div className="pt-2 mt-1 border-t border-white/15 flex items-center gap-1 text-[10px] text-purple-100 font-medium">
                <Clock className="w-3 h-3 text-white" />
                <span>{currentStaff?.shiftHours || 8} ម៉ោង/ថ្ងៃ</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* VIEW 2: REFINED iOS MODERN LIST VIEW */
        /* ========================================================= */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-2 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {/* Item 1: Attendance */}
          <button
            type="button"
            onClick={() => handleAction("ATTENDANCE")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-105 transition">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-battambang text-slate-800 dark:text-white">
                  {isAdmin ? "វត្តមានបុគ្គលិក (Attendance Records)" : "វត្តមានផ្ទាល់ខ្លួន (My Attendance)"}
                </div>
                <div className="text-[11px] text-slate-400 font-kantumruy">
                  {isAdmin ? "ពិនិត្យវត្តមានបុគ្គលិកគ្រប់សាខា" : "កំណត់ត្រាវត្តមាន & ភាពទៀងទាត់"}
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          {/* Item 2: Leave */}
          <button
            type="button"
            onClick={() => handleAction("LEAVE")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-105 transition">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-battambang text-slate-800 dark:text-white flex items-center gap-1.5">
                  <span>សុំច្បាប់សម្រាក (Leave Request)</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded-md">
                    សល់ {quotaRemaining} ថ្ងៃ
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-kantumruy">
                  ទម្រង់លិខិតផ្លូវការ ភ្ជាប់ហត្ថលេខា & ត្រា
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          {/* Item 3: Salary (Admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleAction("SALARY")}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 group-hover:scale-105 transition">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold font-battambang text-slate-800 dark:text-white flex items-center gap-1.5">
                    <span>តារាងប្រាក់ខែបុគ្គលិក (Salary & Payroll)</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black px-1.5 py-0.2 rounded-md">
                      Admin ធំ
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-kantumruy">
                    បញ្ចូល កែប្រែប្រាក់ខែ & Export CSV
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          )}

          {/* Item 4: Clock Attendance */}
          <button
            type="button"
            onClick={() => handleAction("CLOCK")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/25 group-hover:scale-105 transition">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-battambang text-slate-800 dark:text-white">
                  ស្កេនវត្តមាន QR (Clock Attendance)
                </div>
                <div className="text-[11px] text-slate-400 font-kantumruy">
                  ស្កេនកូដ QR សាខាក្នុងកាំ &le;100m
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          {/* Item 5: Calendar */}
          <button
            type="button"
            onClick={() => handleAction("CALENDAR")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 group-hover:scale-105 transition">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-battambang text-slate-800 dark:text-white">
                  ប្រតិទិនការងារ (Work Calendar)
                </div>
                <div className="text-[11px] text-slate-400 font-kantumruy">
                  កាលវិភាគការងារ វេនម៉ោង & ថ្ងៃឈប់សម្រាក
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
