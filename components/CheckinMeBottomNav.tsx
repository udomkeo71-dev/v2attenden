"use client";

import React from "react";
import {
  Home,
  CalendarCheck,
  QrCode,
  Users,
  DollarSign,
  User,
  MessageSquareText,
  Sliders,
} from "lucide-react";
import { soundEffects } from "@/lib/audio";

export type BottomNavTab = "HOME" | "ATTENDANCE" | "CLOCK" | "SALARY" | "STAFF" | "SETTINGS";

interface CheckinMeBottomNavProps {
  activeTab: BottomNavTab;
  onChangeTab: (tab: BottomNavTab) => void;
  isAdmin?: boolean;
  onOpenLeaveModal?: () => void;
}

export const CheckinMeBottomNav: React.FC<CheckinMeBottomNavProps> = ({
  activeTab,
  onChangeTab,
  isAdmin = true,
  onOpenLeaveModal,
}) => {
  const handleTabClick = (tab: BottomNavTab) => {
    soundEffects.playClick();
    onChangeTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 font-kantumruy shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-3 sm:px-4 h-16 flex items-center justify-between relative">
        {/* TAB 1: Home */}
        <button
          type="button"
          onClick={() => handleTabClick("HOME")}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
            activeTab === "HOME"
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5" />
            {activeTab === "HOME" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-battambang">ទំព័រដើម</span>
        </button>

        {/* TAB 2: Attendance */}
        <button
          type="button"
          onClick={() => handleTabClick("ATTENDANCE")}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
            activeTab === "ATTENDANCE"
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <div className="relative">
            <CalendarCheck className="w-5 h-5" />
            {activeTab === "ATTENDANCE" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-battambang">
            {isAdmin ? "វត្តមាន" : "វត្តមានខ្ញុំ"}
          </span>
        </button>

        {/* TAB 3: CENTER HERO ELEVATED QR SCAN BUTTON */}
        <div className="flex-1 flex items-center justify-center -mt-6">
          <button
            type="button"
            onClick={() => handleTabClick("CLOCK")}
            className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white flex flex-col items-center justify-center shadow-xl shadow-orange-500/35 ring-4 ring-white dark:ring-slate-900 transition-all duration-300 transform active:scale-90 hover:scale-105"
            title="ស្កេនវត្តមាន QR"
          >
            {/* Ambient Pulse Ring */}
            <span className="absolute inset-0 rounded-full bg-amber-400 opacity-20 animate-ping pointer-events-none" />
            <QrCode className="w-6 h-6 transition group-hover:scale-110 drop-shadow-xs" />
            <span className="text-[8px] font-black uppercase tracking-tight -mt-0.5 font-sans">
              SCAN
            </span>
          </button>
        </div>

        {/* TAB 4: Role-Based (Payroll for Admin VS Leave Request for Staff) */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => handleTabClick("SALARY")}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
              activeTab === "SALARY"
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            }`}
          >
            <div className="relative">
              <DollarSign className="w-5 h-5" />
              {activeTab === "SALARY" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-battambang">ប្រាក់ខែ</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              if (onOpenLeaveModal) onOpenLeaveModal();
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-1 font-battambang">សុំច្បាប់</span>
          </button>
        )}

        {/* TAB 5: Management / Settings / Account */}
        <button
          type="button"
          onClick={() => handleTabClick(isAdmin ? "STAFF" : "SETTINGS")}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 ${
            (activeTab === "STAFF" || activeTab === "SETTINGS")
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <div className="relative">
            {isAdmin ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {(activeTab === "STAFF" || activeTab === "SETTINGS") && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-battambang">
            {isAdmin ? "បុគ្គលិក" : "គណនីខ្ញុំ"}
          </span>
        </button>
      </div>
    </nav>
  );
};
