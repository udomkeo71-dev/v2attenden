"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Staff, LeaveRequest, LeaveStatus, BranchId, ShiftDurationHours } from "@/types";
import {
  X,
  Calendar,
  Send,
  CheckCircle2,
  MessageSquareText,
  AlertTriangle,
  Bot,
  DollarSign,
  Clock,
  Users,
  Building,
  Check,
  Search,
  Sparkles,
  Info,
  FileText,
  Printer,
  Eye,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { soundEffects } from "@/lib/audio";
import {
  loadSettings,
  loadLeaveRequests,
  saveLeaveRequest,
  updateLeaveRequestStatus,
  INITIAL_STAFF,
} from "@/lib/storage";
import { formatTelegramLeaveMessage, generateLeaveVoucherBadge } from "@/lib/leaveVoucher";
import { V2_BRANCHES } from "@/lib/branches";
import SignaturePad from "./SignaturePad";

interface LeaveRequestModalProps {
  isOpen: boolean;
  staffList?: Staff[];
  currentStaff?: Staff;
  isAdmin?: boolean;
  onClose: () => void;
  onSubmitSuccess?: (leave: LeaveRequest) => void;
}

export const LEAVE_PRESET_TYPES = [
  { id: "AL", label: "🏖️ ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)", defaultUseAL: true },
  { id: "SICK", label: "🤒 ច្បាប់ឈឺ / ព្យាបាល (Sick)", defaultUseAL: true },
  { id: "URGENT", label: "⚡ ធុរៈផ្ទាល់ខ្លួនបន្ទាន់ (Personal)", defaultUseAL: true },
  { id: "MATERNITY", label: "🍼 ច្បាប់លំហែមាតុភាព (Maternity)", defaultUseAL: false },
  { id: "UNPAID", label: "📝 សម្រាកពិសេស / គ្មានប្រាក់ខែ (Unpaid)", defaultUseAL: false },
];

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  staffList = INITIAL_STAFF,
  currentStaff,
  isAdmin = true,
  onClose,
  onSubmitSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"NEW" | "OFFICIAL_PREVIEW" | "HISTORY">("NEW");

  // Staff search & selection: locked to currentStaff if not admin
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    (!isAdmin && currentStaff ? currentStaff.id : staffList[0]?.id) || "admin-user"
  );
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  useEffect(() => {
    if (!isAdmin && currentStaff) {
      setSelectedStaffId(currentStaff.id);
      setApplicantSignature(currentStaff.name);
    }
  }, [isAdmin, currentStaff]);

  // Official paper form fields
  const [gender, setGender] = useState<"ប្រុស" | "ស្រី">("ប្រុស");
  const [useAL, setUseAL] = useState<boolean>(true);
  const [leaveType, setLeaveType] = useState<string>(LEAVE_PRESET_TYPES[0].label);

  // Duration Mode: DAYS (គិតជាថ្ងៃ) or HOURS (គិតជាម៉ោង)
  const [durationUnit, setDurationUnit] = useState<"DAYS" | "HOURS">("DAYS");
  const [leaveHours, setLeaveHours] = useState<number>(2);
  const [fromTime, setFromTime] = useState<string>("07:30");
  const [toTime, setToTime] = useState<string>("09:30");

  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [resumeDate, setResumeDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [portion, setPortion] = useState<"FULL" | "MORNING" | "AFTERNOON">("FULL");

  const [classGroupName, setClassGroupName] = useState<string>("");
  const [classShiftTime, setClassShiftTime] = useState<string>("");
  const [classGroupName2, setClassGroupName2] = useState<string>("");
  const [classShiftTime2, setClassShiftTime2] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [substituteStaff, setSubstituteStaff] = useState<string>("");
  const [applicantSignature, setApplicantSignature] = useState<string>("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedLeave, setLastSubmittedLeave] = useState<LeaveRequest | null>(null);

  // History
  const [history, setHistory] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(loadLeaveRequests());
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const selectedStaff =
    staffList.find((s) => s.id === selectedStaffId) || staffList[0] || INITIAL_STAFF[0];

  // Update signature default when staff changes
  useEffect(() => {
    if (selectedStaff && !applicantSignature) {
      setApplicantSignature(selectedStaff.name);
    }
  }, [selectedStaff, applicantSignature]);

  if (!isOpen) return null;

  const quotaTotal = selectedStaff?.leaveQuota ?? 18;
  const quotaUsed = selectedStaff?.leaveUsed ?? 0;
  const quotaRemaining = quotaTotal - quotaUsed;
  const staffShift = selectedStaff?.shiftHours || 8;

  // Calculate requested total days (supports both DAYS and HOURS)
  let totalDays = 1;
  if (durationUnit === "HOURS") {
    totalDays = parseFloat((leaveHours / staffShift).toFixed(2));
  } else {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const dayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalDays = portion === "FULL" ? dayCount : dayCount * 0.5;
    }
  }

  // Quota calculation based on useAL
  const remainingAfter = useAL ? quotaRemaining - totalDays : quotaRemaining;
  const isQuotaExceeded = useAL && totalDays > quotaRemaining;

  const branch = V2_BRANCHES[selectedStaff?.branchId || "BKK"];
  const isTeacher =
    (selectedStaff?.category || (selectedStaff?.role?.includes("គ្រូ") ? "TEACHER" : "STAFF")) ===
    "TEACHER";
  const subjectOrDept = isTeacher
    ? selectedStaff?.subject || "បង្រៀន"
    : selectedStaff?.department || "រដ្ឋបាល";

  // Filter staff list for quick selection
  const filteredStaffList = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      s.branchId.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reason.trim()) {
      alert("សូមបញ្ចូលមូលហេតុនៃការសុំច្បាប់");
      return;
    }

    setIsSubmitting(true);

    try {
      const settings = loadSettings();
      const now = new Date();

      const newLeave: LeaveRequest = {
        id: `leave-${Date.now()}`,
        timestamp: now.toISOString(),
        formattedTime: now.toLocaleTimeString("km-KH", { hour12: false }),
        formattedDate: now.toLocaleDateString("km-KH"),
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        staffRole: selectedStaff.role,
        branchId: selectedStaff.branchId,
        branchName: branch.nameKhmer,
        category: isTeacher ? "TEACHER" : "STAFF",
        subjectOrDept,
        baseSalary: selectedStaff.baseSalary ?? 500,
        shiftHours: selectedStaff.shiftHours ?? 8,
        leaveType,
        startDate,
        endDate:
          durationUnit === "HOURS"
            ? `${startDate} (${leaveHours} ម៉ោង: ${fromTime} - ${toTime})`
            : portion !== "FULL"
            ? `${endDate} (${portion === "MORNING" ? "ពេលព្រឹក" : "ពេលរសៀល"})`
            : endDate,
        totalDays,
        durationUnit,
        leaveHours: durationUnit === "HOURS" ? leaveHours : undefined,
        fromTime: durationUnit === "HOURS" ? fromTime : undefined,
        toTime: durationUnit === "HOURS" ? toTime : undefined,
        reason: reason.trim(),
        substituteStaff: substituteStaff.trim() || undefined,
        leaveQuotaTotal: quotaTotal,
        leaveQuotaUsed: useAL ? parseFloat((quotaUsed + totalDays).toFixed(2)) : quotaUsed,
        leaveQuotaRemaining: parseFloat(remainingAfter.toFixed(2)),
        isQuotaExceeded,
        useAL,
        gender,
        resumeDate: resumeDate || endDate,
        classGroupName: classGroupName.trim() || undefined,
        classShiftTime: classShiftTime.trim() || (durationUnit === "HOURS" ? `${fromTime} - ${toTime}` : undefined),
        classGroupName2: classGroupName2.trim() || undefined,
        classShiftTime2: classShiftTime2.trim() || undefined,
        applicantSignature: applicantSignature.trim() || selectedStaff.name,
        signatureDataUrl: signatureDataUrl || undefined,
        signatureDate: now.toLocaleDateString("km-KH"),
        status: "PENDING",
        accountantChatId: settings.telegramAccountingChatId || settings.telegramChatId,
        telegramSent: true,
      };

      // 1. Generate digital official leave voucher image (A4 paper replica with real signature)
      const photoBase64 = await generateLeaveVoucherBadge(newLeave);

      // 2. Format Telegram message
      const telegramMessage = formatTelegramLeaveMessage(newLeave);

      // 3. Send to Accounting Telegram chat ID!
      const targetChatId =
        settings.telegramAccountingChatId || settings.telegramChatId || "7770204305";

      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.telegramBotToken,
          chatId: targetChatId,
          message: telegramMessage,
          photoBase64,
        }),
      });

      // 4. Save to storage
      saveLeaveRequest(newLeave);
      setHistory(loadLeaveRequests());

      soundEffects.playSuccess();
      setLastSubmittedLeave(newLeave);
      setIsSubmitted(true);

      if (onSubmitSuccess) {
        onSubmitSuccess(newLeave);
      }
    } catch (err) {
      console.error("Leave request error:", err);
      alert("មានបញ្ហាក្នុងការផ្ញើពាក្យសុំច្បាប់ទៅកាន់ Telegram គណនេយ្យ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (leaveId: string, newStatus: LeaveStatus) => {
    const updated = updateLeaveRequestStatus(leaveId, newStatus);
    setHistory(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150 font-kantumruy">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* ========================================================= */}
        {/* OFFICIAL V2 EDUCATION LETTERHEAD HEADER (WITH REAL V2 LOGO) */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            {/* Real V2b Education Logo */}
            <div className="h-11 px-2.5 py-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs shrink-0">
              <Image
                src="/v2b.png"
                alt="V2 Education Logo"
                width={105}
                height={38}
                className="h-9 w-auto object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-battambang text-slate-900 dark:text-white">
                  ផ្ទះគ្រូបង្រៀនគំរូ V2 Education ({branch.nameKhmer})
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                V2 Education Learning Center — ចាំ យល់ បកស្រាយបាន = ចេះប្រាកដ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Form vs Official Document View vs History */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 shrink-0 overflow-x-auto bg-slate-50/40 dark:bg-slate-800/30">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("NEW")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "NEW"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ទម្រង់ពាក្យសុំច្បាប់</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("OFFICIAL_PREVIEW")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "OFFICIAL_PREVIEW"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>មើលគំរូផ្លូវការ (Paper Form)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "HISTORY"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>ប្រវត្តិសុំច្បាប់ ({history.length})</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400 hidden sm:block">
            acc គណនេយ្យ: {loadSettings().telegramAccountingChatId || "7770204305"}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================= */}
          {/* TAB 1: NEW LEAVE REQUEST FORM */}
          {/* ========================================================= */}
          {activeTab === "NEW" && (
            isSubmitted && lastSubmittedLeave ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="font-bold text-base font-battambang text-slate-900 dark:text-white">
                    បានបញ្ជូនពាក្យសុំច្បាប់ទៅកាន់ Telegram គណនេយ្យកររួចរាល់!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Telegram Bot បានផ្ញើលិខិតផ្លូវការ រួមទាំងកាត Digital Leave Voucher និងសមតុល្យ AI រួចរាល់។
                  </p>
                </div>

                {/* Voucher summary */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 font-kantumruy max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">បុគ្គលិក:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lastSubmittedLeave.staffName} ({lastSubmittedLeave.gender || "—"})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ប្រភេទច្បាប់:</span>
                    <span className="font-semibold text-blue-600">{lastSubmittedLeave.leaveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ជម្រើស AL:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        lastSubmittedLeave.useAL
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {lastSubmittedLeave.useAL ? "🟢 ប្រើប្រាស់ AL (កាត់កូតា)" : "⚪ អត់ប្រើ AL (មិនកាត់កូតា)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">រយៈពេលសុំ:</span>
                    <span className="font-bold text-amber-600 font-mono">
                      {lastSubmittedLeave.durationUnit === "HOURS"
                        ? `${lastSubmittedLeave.leaveHours} ម៉ោង (ស្មើ ${lastSubmittedLeave.totalDays} ថ្ងៃ)`
                        : `${lastSubmittedLeave.totalDays} ថ្ងៃ`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">កាលបរិច្ឆេទ:</span>
                    <span className="font-mono">
                      {lastSubmittedLeave.startDate} {lastSubmittedLeave.startDate !== lastSubmittedLeave.endDate && `ដល់ ${lastSubmittedLeave.endDate}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">សមតុល្យច្បាប់ AI នៅសល់:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {lastSubmittedLeave.leaveQuotaRemaining} ថ្ងៃ
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setReason("");
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition"
                  >
                    សុំច្បាប់បន្ថែមទៀត
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    បិទផ្ទាំង
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. SELECT STAFF: LOCKED FOR STAFF, 1-TAP CARDS & SEARCH FOR ADMIN */}
                {!isAdmin && currentStaff ? (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                        {currentStaff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-white font-battambang">
                            {currentStaff.name}
                          </span>
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                            គណនីផ្ទាល់ខ្លួន
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          កូដ៖ <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{currentStaff.code || currentStaff.id}</span> • {currentStaff.branchId} • {currentStaff.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ចាក់សោត្រឹមត្រូវ</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-battambang">
                        <span>១. ជ្រើសរើសបុគ្គលិក / គ្រូ (ចុច ១-Tap ជ្រើសរើស)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-blue-600 font-bold">
                        កំពុងជ្រើស: {selectedStaff?.name}
                      </span>
                    </div>

                    {/* Search filter */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ស្វែងរកឈ្មោះ, មុខវិជ្ជា, ផ្នែក, ឬសាខា..."
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    {/* 1-Tap Clickable Staff Cards (NO DROPDOWN) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1.5 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {filteredStaffList.map((s) => {
                        const isSelected = selectedStaffId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffId(s.id);
                              setApplicantSignature(s.name);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition text-xs flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="truncate pr-1">
                              <div className="font-bold truncate">{s.name}</div>
                              <div className={`text-[10px] truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                                {s.branchId} • {s.role}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. OFFICIAL FORM DETAILS: GENDER, ROLE, SUBJECT, BRANCH */}
                <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 p-4 rounded-2xl border border-blue-200/70 dark:border-blue-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm font-battambang text-slate-900 dark:text-white">
                        {selectedStaff?.name}
                      </div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                        {isTeacher
                          ? `👨‍🏫 គ្រូ${selectedStaff?.subject || "បង្រៀន"}`
                          : `🏢 ផ្នែក${selectedStaff?.department || "រដ្ឋបាល"}`}{" "}
                        • {branch.nameKhmer}
                      </div>
                    </div>

                    {/* Gender Toggle: ប្រុស / ស្រី (FROM PAPER FORM) */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-[10px] font-semibold text-slate-400 px-1">ភេទ:</span>
                      <button
                        type="button"
                        onClick={() => setGender("ប្រុស")}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                          gender === "ប្រុស"
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        ប្រុស
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("ស្រី")}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                          gender === "ស្រី"
                            ? "bg-pink-600 text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        ស្រី
                      </button>
                    </div>
                  </div>

                  {/* AI Leave Balance Bar */}
                  <div className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-xl border border-blue-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-purple-600" />
                        <span>សមតុល្យច្បាប់ AI ប្រចាំឆ្នាំ:</span>
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">
                        {quotaRemaining} ថ្ងៃនៅសល់
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-600 h-full transition-all"
                        style={{ width: `${Math.min(100, (quotaUsed / quotaTotal) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>កូតាសរុប: {quotaTotal} ថ្ងៃ</span>
                      <span>បានប្រើរួច: {quotaUsed} ថ្ងៃ</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        សល់: {quotaRemaining} ថ្ងៃ
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. AL BUTTONS: ប្រើប្រាស់ AL ឬ អត់ប្រើ AL (EXPLICIT USER DEMAND) */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-battambang">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ជម្រើសប្រើប្រាស់ AL (Annual Leave) <span className="text-rose-500">*</span></span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    សូមជ្រើសរើសថាតើការសុំច្បាប់នេះកាត់កូតាច្បាប់ប្រចាំឆ្នាំ (AL) ឬមិនកាត់
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* BUTTON 1: ប្រើប្រាស់ AL */}
                    <button
                      type="button"
                      onClick={() => setUseAL(true)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        useAL
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">🟢 ប្រើប្រាស់ AL (កាត់កូតា)</div>
                        <div className={`text-[10px] mt-0.5 ${useAL ? "text-emerald-100" : "text-slate-400"}`}>
                          កាត់កូតាច្បាប់ប្រចាំឆ្នាំ (មានប្រាក់ខែពេញ)
                        </div>
                      </div>
                      {useAL && <Check className="w-4 h-4 shrink-0 ml-1" />}
                    </button>

                    {/* BUTTON 2: អត់ប្រើ AL */}
                    <button
                      type="button"
                      onClick={() => setUseAL(false)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        !useAL
                          ? "bg-slate-800 text-white border-slate-800 shadow-sm ring-2 ring-slate-700/20 dark:bg-slate-700"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">⚪ អត់ប្រើ AL (មិនកាត់កូតា)</div>
                        <div className={`text-[10px] mt-0.5 ${!useAL ? "text-slate-200" : "text-slate-400"}`}>
                          មិនកាត់កូតា (Unpaid/ច្បាប់ពិសេស/មាតុភាព)
                        </div>
                      </div>
                      {!useAL && <Check className="w-4 h-4 shrink-0 ml-1" />}
                    </button>
                  </div>
                </div>

                {/* 4. LEAVE TYPE - 1-TAP PILLS (NO SELECT DROPDOWN) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-battambang">
                    ប្រភេទច្បាប់ (ចុច ១-Tap ជ្រើសរើស ឬវាយបញ្ចូល) <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {LEAVE_PRESET_TYPES.map((preset) => {
                      const isSelected = leaveType === preset.label;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setLeaveType(preset.label);
                            setUseAL(preset.defaultUseAL);
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl border transition font-medium ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 font-bold shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    required
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    placeholder="វាយបញ្ចូលប្រភេទច្បាប់ផ្សេងៗ..."
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden mt-1"
                  />
                </div>

                {/* ========================================================= */}
                {/* 5. DURATION UNIT: គិតជាថ្ងៃ (DAYS) ឬ គិតជាម៉ោង (HOURS) */}
                {/* ========================================================= */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-battambang">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>ឯកតារយៈពេលសុំច្បាប់ (គិតជាថ្ងៃ ឬ គិតជាម៉ោង) <span className="text-rose-500">*</span></span>
                    </label>
                  </div>

                  {/* Mode Toggle: DAYS vs HOURS */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setDurationUnit("DAYS")}
                      className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        durationUnit === "DAYS"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>📅 គិតជាថ្ងៃ (Days)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationUnit("HOURS")}
                      className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        durationUnit === "HOURS"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>⏱️ គិតជាម៉ោង (Hours)</span>
                    </button>
                  </div>

                  {/* IF DURATION UNIT IS HOURS: (មានកន្លែងសរសេរចំនួនម៉ោងច្បាស់លាស់) */}
                  {durationUnit === "HOURS" ? (
                    <div className="space-y-3 pt-1">
                      {/* Leave Date */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          កាលបរិច្ឆេទសុំច្បាប់ (Leave Date) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setEndDate(e.target.value);
                          }}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>

                      {/* Direct input for Hours */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block font-battambang">
                            វាយបញ្ចូលចំនួនម៉ោងសុំច្បាប់ (Type Hours) <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300">
                            {leaveHours} ម៉ោង (សមមូល {totalDays} ថ្ងៃ)
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.5"
                            max="24"
                            step="0.5"
                            required
                            value={leaveHours}
                            onChange={(e) => setLeaveHours(Math.max(0.5, Number(e.target.value)))}
                            placeholder="វាយចំនួនម៉ោង ឧ. 1, 2, 3, 4..."
                            className="w-full text-xs font-mono font-bold pl-3.5 pr-14 py-2.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
                            ម៉ោង
                          </span>
                        </div>

                        {/* Quick-tap Chips for Hours */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setLeaveHours(h)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                                leaveHours === h
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {h} ម៉ោង
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Range: ចាប់ពីម៉ោង - ដល់ម៉ោង */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            ចាប់ពីម៉ោង (From Time)
                          </label>
                          <input
                            type="time"
                            value={fromTime}
                            onChange={(e) => setFromTime(e.target.value)}
                            className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            ដល់ម៉ោង (To Time)
                          </label>
                          <input
                            type="time"
                            value={toTime}
                            onChange={(e) => setToTime(e.target.value)}
                            className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* IF DURATION UNIT IS DAYS: (គិតជាថ្ងៃ) */
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            ចាប់ពីថ្ងៃទី (From) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              if (e.target.value > endDate) setEndDate(e.target.value);
                            }}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            ដល់ថ្ងៃទី (To) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={endDate}
                            onChange={(e) => {
                              setEndDate(e.target.value);
                              const nextD = new Date(e.target.value);
                              nextD.setDate(nextD.getDate() + 1);
                              setResumeDate(nextD.toISOString().split("T")[0]);
                            }}
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            ត្រឡប់មកវិញថ្ងៃទី (Resume) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={resumeDate}
                            onChange={(e) => setResumeDate(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      {/* Portion Selector - 3 Buttons */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          វេនសុំច្បាប់ (Portion)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPortion("FULL")}
                            className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition ${
                              portion === "FULL"
                                ? "bg-blue-600 text-white font-bold border-blue-600 shadow-2xs"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 bg-white dark:bg-slate-800"
                            }`}
                          >
                            ពេញមួយថ្ងៃ (Full)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPortion("MORNING")}
                            className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition ${
                              portion === "MORNING"
                                ? "bg-blue-600 text-white font-bold border-blue-600 shadow-2xs"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 bg-white dark:bg-slate-800"
                            }`}
                          >
                            ពេលព្រឹក (0.5 ថ្ងៃ)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPortion("AFTERNOON")}
                            className={`py-2 px-2 text-xs rounded-xl border text-center font-medium transition ${
                              portion === "AFTERNOON"
                                ? "bg-blue-600 text-white font-bold border-blue-600 shadow-2xs"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 bg-white dark:bg-slate-800"
                            }`}
                          >
                            ពេលរសៀល (0.5 ថ្ងៃ)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. CLASS GROUP & SHIFT TIME (FROM PAPER FORM: ឈ្មោះក្រុម/ថ្នាក់ & ម៉ោងចូល-ម៉ោងចេញ ២ ជួរ) */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between font-battambang">
                    <span>ឈ្មោះក្រុម/ថ្នាក់ និងម៉ោងចូល-ម៉ោងចេញ (តាមគំរូលិខិត)</span>
                    <span className="text-[10px] text-slate-400 font-normal">សម្រាប់គ្រូបង្រៀន</span>
                  </div>

                  {/* Group 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        ឈ្មោះក្រុមទី ១ (Group 1)
                      </label>
                      <input
                        type="text"
                        placeholder="ឧ. ក្រុម A (គីមីវិទ្យា)"
                        value={classGroupName}
                        onChange={(e) => setClassGroupName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        ម៉ោងចូល - ម៉ោងចេញ (Shift Time)
                      </label>
                      <input
                        type="text"
                        placeholder="ឧ. 07:30 - 09:30"
                        value={classShiftTime}
                        onChange={(e) => setClassShiftTime(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  {/* Group 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-750">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        ឈ្មោះក្រុមទី ២ (Group 2 - បើមាន)
                      </label>
                      <input
                        type="text"
                        placeholder="ឧ. ក្រុម B (រូបវិទ្យា)"
                        value={classGroupName2}
                        onChange={(e) => setClassGroupName2(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        ម៉ោងចូល - ម៉ោងចេញ (Shift Time)
                      </label>
                      <input
                        type="text"
                        placeholder="ឧ. 14:00 - 16:00"
                        value={classShiftTime2}
                        onChange={(e) => setClassShiftTime2(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. REASON & SUBSTITUTE STAFF */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1 font-battambang">
                    មូលហេតុនៃការសុំច្បាប់ (Reason) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="សូមបញ្ជាក់ពីមូលហេតុនៃការសុំច្បាប់សម្រាក..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      អ្នកទទួលបន្ទុកជំនួស (Substitute Colleague)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. គ្រូ ឆាយ ឬ រដ្ឋបាល សុគន្ធា"
                      value={substituteStaff}
                      onChange={(e) => setSubstituteStaff(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      ឈ្មោះសាមីខ្លួន (Applicant Name)
                    </label>
                    <input
                      type="text"
                      placeholder="វាយឈ្មោះសាមីខ្លួន..."
                      value={applicantSignature}
                      onChange={(e) => setApplicantSignature(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-battambang"
                    />
                  </div>
                </div>

                {/* 8. INTERACTIVE DIGITAL SIGNATURE PAD (កន្លែងសុំឪ្យបុគ្គលិកគូសហត្ថលេខា) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <SignaturePad
                    onSignatureChange={setSignatureDataUrl}
                    applicantName={selectedStaff?.name}
                  />
                </div>

                {/* Total Days/Hours & AI Leave Impact Pill */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {durationUnit === "HOURS" ? "រយៈពេលសុំ (ម៉ោង / ថ្ងៃ):" : "ចំនួនថ្ងៃស្នើសុំសរុប:"}
                    </span>
                    <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                      {durationUnit === "HOURS" ? `${leaveHours} ម៉ោង (ស្មើ ${totalDays} ថ្ងៃ)` : `${totalDays} ថ្ងៃ`}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">សមតុល្យ AI បន្ទាប់ពីសុំ:</span>
                    <span className={`text-sm font-bold font-mono ${remainingAfter < 0 ? "text-rose-500 font-black" : "text-emerald-600"}`}>
                      {useAL ? `${remainingAfter} ថ្ងៃ (កាត់ AL)` : `${quotaRemaining} ថ្ងៃ (មិនកាត់ AL)`}
                    </span>
                  </div>
                </div>

                {/* Warning if exceeded and using AL */}
                {isQuotaExceeded && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 rounded-2xl flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">⚠️ ស្នើសុំលើសកូតាច្បាប់ AL ({totalDays} ថ្ងៃ &gt; សល់ {quotaRemaining} ថ្ងៃ)</div>
                      <div className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                        សំណើនេះនឹងត្រូវបញ្ជូនជូនគណនេយ្យករដើម្បីពិចារណាកាត់ប្រាក់ខែតាមច្បាប់ការងារ។
                      </div>
                    </div>
                  </div>
                )}

                {/* Notice */}
                <div className="text-[11px] text-slate-500 bg-sky-50/70 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-200/60 dark:border-sky-800/40 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>
                    Telegram Bot នឹងបញ្ជូនពាក្យសុំច្បាប់នេះទៅកាន់ <b>acc គណនេយ្យ</b> រួមទាំងរូបភាពកាតច្បាប់ Digital Voucher។
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab("OFFICIAL_PREVIEW")}
                    className="px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>មើលគំរូទម្រង់</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition"
                  >
                    បោះបង់
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-battambang transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "កំពុងបញ្ជូនទៅគណនេយ្យ..." : "ផ្ញើទៅកាន់ acc គណនេយ្យ"}</span>
                  </button>
                </div>
              </form>
            )
          )}

          {/* ========================================================= */}
          {/* TAB 2: OFFICIAL PAPER FORM PREVIEW (EXACT REPLICA WITH REAL LOGO) */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* TAB 2: OFFICIAL PAPER FORM PREVIEW (EXACT REPLICA OF media_1790335381650.png) */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* TAB 2: OFFICIAL PAPER FORM PREVIEW (EXACT REPLICA OF media_1790344836612.png) */}
          {/* ========================================================= */}
          {activeTab === "OFFICIAL_PREVIEW" && (
            <div className="space-y-4">
              {/* Paper Replica Container (Double Border matching media_1790344836612.png) */}
              <div className="bg-white text-slate-900 border-2 border-slate-300 dark:border-slate-700 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 font-kantumruy relative">
                {/* 1. Header (Logo on Left, Official Heading on Right) */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  {/* Left: V2 Official Logo */}
                  <div className="flex flex-col items-start shrink-0">
                    <div className="h-14 flex items-center justify-center">
                      <Image
                        src="/v2b.png"
                        alt="V2 Education Logo"
                        width={140}
                        height={55}
                        className="h-12 w-auto object-contain"
                        priority
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 italic mt-0.5">
                      បដិវត្តន៍ការអប់រំ
                    </span>
                  </div>

                  {/* Right: Official Center Heading */}
                  <div className="flex-1 text-center pr-6">
                    <h2 className="font-bold text-base sm:text-lg font-battambang text-slate-900">
                      ផ្ទះគ្រូបង្រៀនគំរូ V2 Education ({branch.nameKhmer})
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      V2 Education Tutorial Learning Center
                    </p>
                    <p className="text-xs text-blue-600 italic font-semibold mt-0.5">
                      «ចាំ យល់ បកស្រាយបាន = ចេះប្រាកដ»
                    </p>
                  </div>
                </div>

                {/* 2. Document Title: ពាក្យសុំច្បាប់ */}
                <div className="text-center pt-2 pb-2">
                  <h3 className="font-bold text-2xl sm:text-3xl font-battambang text-slate-900 tracking-wide border-b-2 border-slate-900 pb-1 px-6 inline-block">
                    ពាក្យសុំច្បាប់
                  </h3>
                </div>

                {/* 3. Section 1: Applicant Information (NO SALARY) */}
                <div className="text-xs sm:text-sm text-slate-800 space-y-2 leading-relaxed">
                  <p>
                    <b>ខ្ញុំបាទ/នាងខ្ញុំឈ្មោះ៖</b>{" "}
                    <span className="font-bold text-slate-900">
                      {selectedStaff?.name}
                    </span>{" "}
                    &nbsp;&nbsp;<b>ភេទ៖</b> {gender || "ប្រុស"} &nbsp;&nbsp;<b>តួនាទី៖</b>{" "}
                    <span className="font-bold text-slate-900">
                      {selectedStaff?.role}
                    </span>{" "}
                    &nbsp;&nbsp;<b>វិញ្ញាសា៖</b>{" "}
                    <span className="font-bold text-slate-900">
                      {subjectOrDept || "ទូទៅ"}
                    </span>
                  </p>
                  <p>
                    នៅផ្ទះគ្រូបង្រៀនគំរូ V2 Education ({branch.nameKhmer}) ។
                  </p>

                  {/* 4. Salutation (Centered, matching media_1790335381650.png) */}
                  <div className="text-center py-2 space-y-0.5">
                    <p className="font-bold font-battambang text-sm text-blue-900">
                      សូមគោរពជូនចំពោះ
                    </p>
                    <p className="font-bold font-battambang text-base text-blue-900">
                      គណៈគ្រប់គ្រង សោម នារី
                    </p>
                    <p className="font-bold font-battambang text-xs text-blue-900">
                      នៃផ្ទះបង្រៀនគំរូ V2 Education
                    </p>
                  </div>

                  {/* 5. Section 2: Leave Request Details */}
                  <div className="space-y-1.5 pt-1">
                    <p>
                      <b>កម្មវត្ថុ ៖</b> ស្នើសុំឈប់សម្រាកចំនួន{" "}
                      <span className="font-bold text-blue-900">
                        {durationUnit === "HOURS"
                          ? `${leaveHours} ម៉ោង (ពីម៉ោង ${fromTime} ដល់ ${toTime})`
                          : `${totalDays} ថ្ងៃ`}
                      </span>{" "}
                      {startDate === endDate ? (
                        <span>ពីថ្ងៃទី <b className="font-mono">{startDate}</b></span>
                      ) : (
                        <span>ពីថ្ងៃទី <b className="font-mono">{startDate}</b> ដល់ថ្ងៃទី <b className="font-mono">{endDate}</b></span>
                      )}
                    </p>

                    {/* Group 1 line */}
                    <p>
                      <b>ឈ្មោះក្រុម ៖</b>{" "}
                      <span>{classGroupName || "...................................."}</span>{" "}
                      &nbsp;&nbsp;<b>ម៉ោងចូល-ម៉ោងចេញ ៖</b>{" "}
                      <span className="font-mono">{classShiftTime || "................"}</span>
                    </p>

                    {/* Group 2 line */}
                    {(classGroupName2 || !classGroupName) && (
                      <p>
                        <b>ឈ្មោះក្រុម ៖</b>{" "}
                        <span>{classGroupName2 || "...................................."}</span>{" "}
                        &nbsp;&nbsp;<b>ម៉ោងចូល-ម៉ោងចេញ ៖</b>{" "}
                        <span className="font-mono">{classShiftTime2 || "................"}</span>
                      </p>
                    )}

                    <p>
                      <b>នឹងត្រឡប់មក បង្រៀន/បំពេញការងារ ធម្មតាវិញនៅថ្ងៃទី ៖</b>{" "}
                      <span className="font-mono font-bold text-indigo-900">
                        {resumeDate || endDate}
                      </span>{" "}
                      ។
                    </p>
                    <p>
                      <b>មូលហេតុ ៖</b> {reason || "......................................................................................."} ។
                    </p>
                    {substituteStaff && (
                      <p>
                        <b>អ្នកទទួលបន្ទុកជំនួស ៖</b> {substituteStaff} ។
                      </p>
                    )}
                  </div>

                  {/* 6. Section 3: Official AL & Quota Summary Box (from media_1790344836612.png) */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs mt-3">
                    <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <span>📋 ព័ត៌មានកូតាច្បាប់ &amp; គណនេយ្យ (LEAVE QUOTA &amp; ACCOUNTING):</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 space-y-1 text-[11px] sm:text-xs">
                      <p>
                        • <b>ប្រភេទច្បាប់៖</b> {leaveType} &nbsp;|&nbsp; <b>ការប្រើប្រាស់ AL៖</b>{" "}
                        {useAL ? (
                          <span className="font-bold text-emerald-600">🟢 ប្រើប្រាស់ AL (កាត់កូតាច្បាប់)</span>
                        ) : (
                          <span className="font-bold text-slate-500">⚪ អត់ប្រើ AL (មិនកាត់កូតា/Unpaid)</span>
                        )}
                      </p>
                      <p>
                        • <b>សមតុល្យច្បាប់ AL៖</b> កូតាសរុប <b>{quotaTotal} ថ្ងៃ</b> &nbsp;|&nbsp; ធ្លាប់ឈប់ <b>{quotaUsed} ថ្ងៃ</b> &nbsp;|&nbsp; ស្នើលើកនេះ <b>{totalDays} ថ្ងៃ</b> &nbsp;|&nbsp; នៅសល់ <b>{quotaRemaining} ថ្ងៃ</b>
                      </p>
                      <p>
                        • <b>ការវិភាគ AI៖</b>{" "}
                        {quotaRemaining < 0 ? (
                          <span className="font-bold text-rose-600">⚠️ ស្នើសុំលើសកូតា AL កំណត់</span>
                        ) : (
                          <span className="font-bold text-emerald-600">✅ ត្រឹមត្រូវតាមលក្ខខណ្ឌច្បាប់ការងារ</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 7. Courtesies */}
                  <div className="pt-3 space-y-1 text-xs text-slate-600">
                    <p>
                      អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូមគណៈគ្រប់គ្រងនៃផ្ទះគ្រូបង្រៀនគំរូ V2 Education មេត្តាអនុញ្ញាតដោយសេចក្តីអនុគ្រោះនិងយោគយល់ ។
                    </p>
                    <p>
                      សូមគណៈគ្រប់គ្រងនៃផ្ទះបង្រៀនគំរូ V2 Education មេត្តាទទួលនូវការគោរពដ៏ខ្ពង់ខ្ពស់ អំពីខ្ញុំបាទ/នាងខ្ញុំ ។
                    </p>
                  </div>
                </div>

                {/* 8. Signatures Block */}
                <div className="grid grid-cols-2 gap-6 pt-5 border-t border-slate-200 text-xs sm:text-sm">
                  {/* Left: Approval by Management & Official Stamp */}
                  <div className="text-center space-y-2">
                    <div>
                      <div className="font-bold text-slate-900 font-battambang text-sm">បានឃើញ និងឯកភាព</div>
                      <div className="text-[11px] text-slate-500 font-battambang">អ្នកទទួលពាក្យ និង អ្នកឯកភាព</div>
                    </div>

                    {/* Official Seal / Stamp Image */}
                    <div className="min-h-24 flex items-center justify-center py-1">
                      <Image
                        src="/v2logoRedCircleSignaturehang.png"
                        alt="ត្រាផ្លូវការ ជំនួយការស្ថាបនិក ហាក់ សេងហាំង"
                        width={220}
                        height={137}
                        className="h-24 sm:h-28 w-auto object-contain drop-shadow-xs"
                        priority
                      />
                    </div>
                  </div>

                  {/* Right: Applicant Drawn Signature */}
                  <div className="text-center space-y-2">
                    <div>
                      <div className="text-[11px] text-slate-500 font-kantumruy">
                        ភ្នំពេញ ថ្ងៃទី {new Date().toLocaleDateString("km-KH")}
                      </div>
                      <div className="font-bold text-slate-900 font-battambang text-sm">ហត្ថលេខាសាមីខ្លួន</div>
                    </div>

                    {/* Render Real Drawn Signature */}
                    <div className="h-16 flex items-center justify-center">
                      {signatureDataUrl ? (
                        <img
                          src={signatureDataUrl}
                          alt="ហត្ថលេខា"
                          className="max-h-14 max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 italic text-[11px] font-battambang">
                          {applicantSignature || selectedStaff?.name}
                        </div>
                      )}
                    </div>

                    <div className="font-bold font-battambang text-slate-900 text-xs">
                      ({applicantSignature || selectedStaff?.name})
                    </div>
                  </div>
                </div>

                {/* Footer Watermark */}
                <div className="text-center pt-3 text-[10px] text-slate-400 border-t border-slate-100">
                  លិខិតសុំច្បាប់ផ្លូវការ V2 Education — បង្កើត និងផ្ទៀងផ្ទាត់ដោយប្រព័ន្ធ V2aAttendence
                </div>
              </div>

              {/* Actions below preview */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("NEW")}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  ← ត្រឡប់ទៅទម្រង់បំពេញ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const formElement = document.querySelector("form");
                    if (formElement) formElement.requestSubmit();
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-battambang transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "កំពុងផ្ញើ..." : "ផ្ញើពាក្យសុំច្បាប់ទៅ Telegram"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LEAVE HISTORY & APPROVALS */}
          {/* ========================================================= */}
          {activeTab === "HISTORY" && (() => {
            const displayHistory = !isAdmin && currentStaff
              ? history.filter((item) => item.staffId === currentStaff.id)
              : history;

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-battambang">
                    {!isAdmin && currentStaff
                      ? `ប្រវត្តិសុំច្បាប់ផ្ទាល់ខ្លួន (${displayHistory.length})`
                      : `ប្រវត្តិពាក្យសុំច្បាប់ទាំងអស់ (${displayHistory.length})`}
                  </div>
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      🔒 បង្ហាញតែទិន្នន័យផ្ទាល់ខ្លួន
                    </span>
                  )}
                </div>

                {displayHistory.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <MessageSquareText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      {!isAdmin
                        ? "លោកអ្នកមិនទាន់មានប្រវត្តិសុំច្បាប់នៅឡើយទេ"
                        : "មិនទាន់មានពាក្យសុំច្បាប់នៅឡើយទេ"}
                    </p>
                  </div>
                ) : (
                  displayHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white font-battambang text-sm">
                            {item.staffName}
                          </span>
                          {item.gender && (
                            <span className="text-[10px] text-slate-400">({item.gender})</span>
                          )}
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                            {item.branchName}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                              item.useAL
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {item.useAL ? "🟢 ប្រើ AL" : "⚪ អត់ AL"}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : item.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {item.status === "APPROVED"
                            ? "✓ បានអនុម័ត"
                            : item.status === "REJECTED"
                            ? "✕ បដិសេធ"
                            : "⏳ កំពុងរង់ចាំពិនិត្យ"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        <div>
                          <b>ប្រភេទច្បាប់៖</b> {item.leaveType} •{" "}
                          <b>រយៈពេល៖</b>{" "}
                          <span className="text-amber-600 font-bold font-mono">
                            {item.durationUnit === "HOURS"
                              ? `${item.leaveHours} ម៉ោង (ស្មើ ${item.totalDays} ថ្ងៃ)`
                              : `${item.totalDays} ថ្ងៃ`}
                          </span>
                        </div>
                        <div className="font-mono text-slate-500">
                          {item.startDate} {item.startDate !== item.endDate && `ដល់ ${item.endDate}`}
                          {item.resumeDate && ` • ត្រឡប់មកវិញ៖ ${item.resumeDate}`}
                        </div>
                        {item.classGroupName && (
                          <div>
                            <b>ថ្នាក់/ក្រុម៖</b> {item.classGroupName} ({item.classShiftTime || "ម៉ោងធម្មតា"})
                          </div>
                        )}
                        <div>
                          <b>មូលហេតុ៖</b> {item.reason}
                        </div>
                        {item.substituteStaff && (
                          <div>
                            <b>អ្នកជំនួស៖</b> {item.substituteStaff}
                          </div>
                        )}
                      </div>

                      {/* Footer: Date & Admin Action Buttons */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          {item.formattedTime} • {item.formattedDate}
                        </span>

                        {isAdmin ? (
                          <div className="flex items-center gap-1.5">
                            {item.status !== "APPROVED" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, "APPROVED")}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold transition flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>អនុម័ត</span>
                              </button>
                            )}
                            {item.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, "REJECTED")}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold transition flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                <span>បដិសេធ</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            {item.status === "PENDING"
                              ? "⏳ រង់ចាំនាយក/រដ្ឋបាលពិនិត្យ"
                              : item.status === "APPROVED"
                              ? "🟢 បានយល់ព្រមរួចរាល់"
                              : "🔴 មិនត្រូវបានអនុម័ត"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
