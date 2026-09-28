"use client";

import React, { useState, useEffect } from "react";
import { Clock, Settings, Building2, ShieldCheck, MapPin, Crown, Send } from "lucide-react";
import { BranchId } from "@/types";
import { V2_BRANCHES } from "@/lib/branches";
import { loadSettings } from "@/lib/storage";

interface HeaderProps {
  currentBranchId: BranchId;
  onSelectBranch: (id: BranchId) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentBranchId,
  onSelectBranch,
  onOpenSettings,
}) => {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [hasTelegramToken, setHasTelegramToken] = useState(false);

  useEffect(() => {
    const checkSettings = () => {
      const s = loadSettings();
      setHasTelegramToken(Boolean(s.telegramBotToken && s.telegramChatId));
    };
    checkSettings();

    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDateStr(
        now.toLocaleDateString("km-KH", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const branch = V2_BRANCHES[currentBranchId];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 font-kantumruy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-battambang text-slate-900 dark:text-white leading-tight">
                V2aAttendence
              </h1>
              {/* Admin Badge */}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700">
                <Crown className="w-3 h-3 text-amber-600" />
                <span>Admin (អ្នកគ្រប់គ្រង)</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              ប្រព័ន្ធកត់ត្រាវត្តមានបុគ្គលិក ៧ សាខា & AI Verification
            </p>
          </div>
        </div>

        {/* Live Clock, Telegram Status & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Telegram Indicator */}
          <button
            onClick={onOpenSettings}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
              hasTelegramToken
                ? "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800"
                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300"
            }`}
            title="ចុចដើម្បីកំណត់ Telegram Bot"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            <span>{hasTelegramToken ? "Telegram: ភ្ជាប់រួច ✓" : "កំណត់ Telegram ↗"}</span>
          </button>

          {/* Live Clock */}
          <div className="hidden lg:flex flex-col items-end border-r border-slate-200 dark:border-slate-800 pr-3">
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>{timeStr || "00:00:00"}</span>
            </div>
            <div className="text-[10px] text-slate-400">{dateStr}</div>
          </div>

          {/* Current Branch Selector Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={currentBranchId}
              onChange={(e) => onSelectBranch(e.target.value as BranchId)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              {Object.values(V2_BRANCHES).map((b) => (
                <option key={b.id} value={b.id} className="dark:bg-slate-800">
                  {b.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            title="ការកំណត់ប្រព័ន្ធ (Settings)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
