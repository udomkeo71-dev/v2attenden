"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AuthSession } from "@/types";
import { Mail, MessageCircle, X, Cake, Sparkles, Send, Crown, User, LogOut } from "lucide-react";

interface CheckinMeTopBarProps {
  unreadCount?: number;
  currentSession?: AuthSession | null;
  onOpenTelegram: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const CheckinMeTopBar: React.FC<CheckinMeTopBarProps> = ({
  unreadCount = 1,
  currentSession,
  onOpenTelegram,
  onOpenNotifications,
  onOpenSettings,
  onLogout,
}) => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  return (
    <div className="space-y-3 font-kantumruy">
      {/* Top Header Row matching Image 1 */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
            <Image src="/v2_n.png" alt="V2" width={28} height={28} className="h-6 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-slate-900 dark:text-white select-none flex items-center">
                <span>V2a</span>
                <span className="text-blue-600">Attendence</span>
              </h1>

              {currentSession?.role === "ADMIN" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span>Admin ធំ</span>
                </span>
              ) : currentSession?.role === "STAFF" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-500" />
                  <span>{currentSession.staffName || "បុគ្គលិក"}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Icons: Red Mail, Blue Chat, Logout Button */}
        <div className="flex items-center space-x-2">
          {/* Logout / Switch Role button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
              title="ចាកចេញ / ប្តូរគណនី"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ចាកចេញ</span>
            </button>
          )}

          {/* Red Mail Button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-sm hover:shadow-md transition active:scale-95"
            title="សារជូនដំណឹង"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Blue Chat Bubble with Notification Badge */}
          <button
            type="button"
            onClick={onOpenTelegram}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-sm hover:shadow-md transition active:scale-95 relative"
            title="Telegram Bot Status"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Birthday / Announcement Banner matching Image 1 */}
      {isBannerVisible && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🎂</span>
            <div>
              <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <span>Check your Birthday!</span>
              </div>
              <p className="text-[11px] text-slate-400">Please confirm your birthday.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBannerVisible(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
            title="បិទ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
