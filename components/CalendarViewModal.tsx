"use client";

import React, { useState } from "react";
import { Staff } from "@/types";
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

interface CalendarViewModalProps {
  isOpen: boolean;
  currentStaff?: Staff;
  onClose: () => void;
}

export const CalendarViewModal: React.FC<CalendarViewModalProps> = ({
  isOpen,
  currentStaff,
  onClose,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  if (!isOpen) return null;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNameKhmer = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
  ][month];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const today = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-battambang text-slate-900 dark:text-white">
                ប្រតិទិនការងារ (My Calendar)
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentStaff ? `${currentStaff.name} • វេន ${currentStaff.checkInTime} - ${currentStaff.checkOutTime}` : "កាលវិភាគការងារ"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="px-5 pt-4 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold font-battambang text-slate-900 dark:text-white">
            ខែ {monthNameKhmer} {year}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 px-5 pt-3 text-center text-[11px] font-bold text-slate-400">
          <span>អា</span>
          <span>ច</span>
          <span>អ</span>
          <span>ពុ</span>
          <span>ព្រ</span>
          <span>សុ</span>
          <span>សៅ</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 p-5 pt-2 text-center text-xs">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isToday =
              today.getDate() === dayNum &&
              today.getMonth() === month &&
              today.getFullYear() === year;

            const dayOfWeek = new Date(year, month, dayNum).getDay();
            const isSunday = dayOfWeek === 0;

            return (
              <div
                key={dayNum}
                className={`h-9 flex flex-col items-center justify-center rounded-xl font-semibold transition ${
                  isToday
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20"
                    : isSunday
                    ? "text-rose-400 bg-rose-50/30 dark:bg-rose-950/20"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{dayNum}</span>
                {isToday && <span className="w-1 h-1 bg-white rounded-full mt-0.5" />}
              </div>
            );
          })}
        </div>

        {/* Footer Shift Details */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>វេនធ្វើការធម្មតា:</span>
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">
              {currentStaff ? `${currentStaff.checkInTime} - ${currentStaff.checkOutTime}` : "07:30 - 17:00"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            ថ្ងៃចន្ទ ដល់ សៅរ៍ (ថ្ងៃអាទិត្យ ឈប់សម្រាក)
          </div>
        </div>
      </div>
    </div>
  );
};
