"use client";

import React, { useState, useEffect } from "react";
import { AttendanceRecord, AttendanceType, Branch, BranchId, Staff, AuthSession, UserRole } from "@/types";
import { V2_BRANCHES, BRANCH_LIST } from "@/lib/branches";
import { validateBranchGeofence } from "@/lib/geofence";
import { evaluatePunctuality } from "@/lib/punctuality";
import { soundEffects } from "@/lib/audio";
import { formatTelegramAttendanceMessage } from "@/lib/telegram";
import { generateAttendanceBadgeImage } from "@/lib/badge";
import { CheckinMeTopBar } from "@/components/CheckinMeTopBar";
import { CheckinMeHeroCard } from "@/components/CheckinMeHeroCard";
import { CheckinMeQuickMenu } from "@/components/CheckinMeQuickMenu";
import { AttendanceCardView } from "@/components/AttendanceCardView";
import { CheckinMeBottomNav, BottomNavTab } from "@/components/CheckinMeBottomNav";
import { LeaveRequestModal } from "@/components/LeaveRequestModal";
import { CalendarViewModal } from "@/components/CalendarViewModal";
import { MyCardModal } from "@/components/MyCardModal";
import { AttendanceScanner } from "@/components/AttendanceScanner";
import { BranchQRStands } from "@/components/BranchQRStands";
import { StaffManagement } from "@/components/StaffManagement";
import { SalaryManagement } from "@/components/SalaryManagement";
import { SettingsModal } from "@/components/SettingsModal";
import { BranchLocationModal } from "@/components/BranchLocationModal";
import { DailyAccountingReportModal } from "@/components/DailyAccountingReportModal";
import { TelegramPreviewModal } from "@/components/TelegramPreviewModal";
import { InstallAppModal } from "@/components/InstallAppModal";
import { PortalLoginGate } from "@/components/PortalLoginGate";
import { exportAttendanceToCSV } from "@/lib/exportCsv";
import {
  loadStaffList,
  saveStaffList,
  loadAttendanceRecords,
  saveAttendanceRecord,
  clearAttendanceRecords,
  loadSettings,
  loadBranchLocations,
  loadAuthSession,
  saveAuthSession,
  verifyCredentials,
  AppSettings,
  INITIAL_STAFF,
} from "@/lib/storage";
import {
  Users,
  ChevronRight,
  QrCode,
  Smartphone,
  ChevronLeft,
  Crown,
  Building,
  Send,
  MapPin,
  CheckCircle,
  Sliders,
  Printer,
  Clock,
  Edit2,
  Tag,
  X,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
} from "lucide-react";

export default function CheckinMeDashboardPage() {
  const [activeTab, setActiveTab] = useState<BottomNavTab>("HOME");
  const [staffInitialTab, setStaffInitialTab] = useState<"STAFF" | "SALARY">("STAFF");
  const [showStandsSubView, setShowStandsSubView] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState<BranchId>("BKK");
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isMyCardModalOpen, setIsMyCardModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Custom branch locations
  const [branchLocations, setBranchLocations] = useState<Record<BranchId, Branch>>(loadBranchLocations());

  // Admin Role Quick Edit Modal
  const [isAdminRoleModalOpen, setIsAdminRoleModalOpen] = useState(false);
  const [adminRoleInput, setAdminRoleInput] = useState("");

  // Authentication session state (Admin ធំ vs Staff)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Telegram Preview modal state
  const [previewRecord, setPreviewRecord] = useState<AttendanceRecord | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [lastSubmissionWasSimulated, setLastSubmissionWasSimulated] = useState(false);

  const [clockAttendanceType, setClockAttendanceType] = useState<AttendanceType>("CHECK_IN");
  const [clockStaffId, setClockStaffId] = useState<string | undefined>(undefined);

  // Success alert banner
  const [recentSuccessMessage, setRecentSuccessMessage] = useState<string | null>(null);

  // Initialize data on mount & verify credentials
  useEffect(() => {
    try {
      const loadedStaff = loadStaffList();
      setStaffList(loadedStaff);

      const loadedRecords = loadAttendanceRecords();
      setRecords(loadedRecords);

      // Check URL parameters (e.g. ?code=8888 or ?code=V2-BKK01 or ?staff=staff-1)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const codeParam = params.get("code") || params.get("admin");
        const staffParam = params.get("staff");

        let resolvedSession: AuthSession | null = null;
        const savedSession = loadAuthSession();

        if (codeParam) {
          // If current saved session matches this code and already has email & phone, restore it
          if (
            savedSession &&
            savedSession.staffEmail &&
            savedSession.staffPhone &&
            (savedSession.staffCode?.toLowerCase() === codeParam.toLowerCase() ||
              (savedSession.role === "ADMIN" &&
                (codeParam.toUpperCase() === "ADMIN2026" ||
                  codeParam === "8888" ||
                  codeParam.toUpperCase() === "ADMIN")))
          ) {
            resolvedSession = savedSession;
          } else {
            // Require participant to fill in Email, Phone, and App Code in the Portal
            resolvedSession = null;
          }
        } else {
          // Restore saved session only if it contains verified contact details
          if (savedSession && savedSession.staffEmail && savedSession.staffPhone) {
            resolvedSession = savedSession;
          } else {
            resolvedSession = null;
          }
        }

        setAuthSession(resolvedSession);

        const b = (params.get("branch") as BranchId | null) || (resolvedSession?.staffBranchId as BranchId | null);
        if (b && V2_BRANCHES[b]) {
          setCurrentBranchId(b);
        }
        if (params.get("mode") === "scan" || params.get("staff") === "1") {
          setActiveTab("CLOCK");
        }

        // Automated check for 9:00 PM nightly report prompt
        const checkNightlySchedule = () => {
          try {
            const now = new Date();
            const hour = now.getHours();
            const todayDateStr = now.toLocaleDateString("en-GB");
            if (hour >= 21) {
              const lastSent = localStorage.getItem("v2_last_nightly_report_date");
              if (lastSent !== todayDateStr) {
                setIsAccountingModalOpen(true);
              }
            }
          } catch (e) {
            console.warn("Nightly schedule check warning:", e);
          }
        };

        checkNightlySchedule();
        const nightlyTimer = setInterval(checkNightlySchedule, 60000);
        return () => clearInterval(nightlyTimer);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const handleAttendanceSubmitted = (
    newRecord: AttendanceRecord,
    isSimulated: boolean
  ) => {
    const updated = saveAttendanceRecord(newRecord);
    setRecords(updated);
    setPreviewRecord(newRecord);
    setLastSubmissionWasSimulated(isSimulated);
    setIsPreviewModalOpen(true);

    setRecentSuccessMessage(
      `បានកត់ត្រាវត្តមាន "${newRecord.staffName}" ជោគជ័យ! (${newRecord.punctuality.labelKhmer})`
    );
    setTimeout(() => {
      setRecentSuccessMessage(null);
    }, 6000);
  };

  // Direct 1-tap Check-In / Check-Out
  const handleDirectRecord = async (type: AttendanceType, staff: Staff) => {
    try {
      const now = new Date();
      const loadedSettings = loadSettings();
      const branch =
        (branchLocations && branchLocations[staff.branchId]) ||
        (branchLocations && branchLocations[currentBranchId]) ||
        V2_BRANCHES[staff.branchId] ||
        V2_BRANCHES[currentBranchId] ||
        V2_BRANCHES.BKK;

      // Determine real coords (Strict: No fake inside fallback!)
      let lat = 0;
      let lng = 0;
      if (loadedSettings.gpsSimMode === "OUTSIDE") {
        lat = branch.latitude + 0.003;
        lng = branch.longitude + 0.003;
      } else if (typeof window !== "undefined" && "geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 0,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // GPS failed or refused
        }
      }

      if (lat === 0 && lng === 0) {
        soundEffects.playError();
        alert(
          "⛔ មិនអាចកត់ត្រាវត្តមានបានទេ — ខ្វះទីតាំង GPS!\n\n" +
          "ប្រព័ន្ធមិនទាន់ទទួលបានទីតាំង GPS ពិតប្រាកដលើទូរស័ព្ទរបស់អ្នកឡើយ។\n" +
          "សូមបើកមុខងារ GPS (Location) លើទូរស័ព្ទរបស់អ្នក និងចុច 'Allow' (អនុញ្ញាត) ឱ្យកម្មវិធីប្រើប្រាស់ទីតាំង។"
        );
        return;
      }

      const geofence = validateBranchGeofence(lat, lng, branch);

      // ⛔ STRICT GEOFENCE ENFORCEMENT: លើសពី ១០០m មិនអាចស្កេនបានទេ
      if (!geofence.isWithinGeofence || geofence.distanceMeters > (branch.radiusMeters || 100)) {
        soundEffects.playError();
        alert(
          `⛔ បដិសេធការកត់ត្រាវត្តមានជាដាច់ខាត!\n\n` +
          `• បុគ្គលិក៖ ${staff.name}\n` +
          `• សាខាកំណត់៖ ${branch.nameKhmer}\n` +
          `• ចម្ងាយបច្ចុប្បន្នរបស់អ្នក៖ ${geofence.distanceMeters} ម៉ែត្រ\n` +
          `• កម្រិតអនុញ្ញាតអតិបរមា៖ ត្រឹមតែ ${branch.radiusMeters || 100} ម៉ែត្រប៉ុណ្ណោះ!\n\n` +
          `📌 គោលការណ៍វិន័យ V2 Education៖ វត្តមានត្រូវតែស្កេនក្នុងបរិវេណសាខាជាក់ស្តែង (≤ 100m)។ មិនអនុញ្ញាតស្កេនពីទីតាំងផ្សេងជាដាច់ខាត!`
        );
        return;
      }

      const punctuality = evaluatePunctuality(type, now, staff);

      // Create high-resolution digital attendance badge card image
      const photoBase64 = generateAttendanceBadgeImage({
        type,
        staffName: staff.name,
        staffRole: staff.role,
        branchName: branch.nameKhmer,
        branchId: branch.id,
        formattedTime: now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        formattedDate: now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        punctualityLabel: punctuality.labelKhmer,
        geofenceStatus: geofence.statusLabelKhmer,
        distanceMeters: geofence.distanceMeters,
      });

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        timestamp: now.toISOString(),
        formattedTime: now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        formattedDate: now.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        type,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        branchId: branch.id,
        branchName: branch.nameKhmer,
        userCoords: { latitude: lat, longitude: lng },
        geofence,
        punctuality,
        aiVerification: {
          isValid: true,
          isRealPerson: true,
          summaryKhmer: "បានកត់ត្រាវត្តមានដោយផ្ទាល់តាមប្រព័ន្ធ V2aAttendence។",
        },
        photoBase64,
        telegramNotified: true,
      };

      // Send Telegram notification (Standard CheckinMeBot 3-line format)
      const telegramMessage = formatTelegramAttendanceMessage(newRecord, staff.subject || staff.department);
      const telegramRes = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: loadedSettings.telegramBotToken,
          chatId: loadedSettings.telegramChatId,
          message: telegramMessage,
          photoBase64,
          sendAsText: true, // 🔒 Strict CheckinMeBot text format from user screenshot
        }),
      });

      const telegramData = await telegramRes.json().catch(() => ({}));
      const isSimulated = Boolean(telegramData.isSimulated);

      soundEffects.playSuccess();
      handleAttendanceSubmitted(newRecord, isSimulated);
    } catch (err) {
      console.error("Direct attendance record error:", err);
    }
  };

  // Session resolution: Admin ធំ vs Staff
  const isAdmin = authSession?.role === "ADMIN";
  const currentStaff = authSession?.role === "STAFF"
    ? (staffList.find((s) => s.id === authSession.staffId || (authSession.staffCode && s.code === authSession.staffCode)) || staffList.find((s) => !s.isAdmin) || staffList[0])
    : (staffList.find((s) => s.id === "admin-user") || staffList[0]);

  const adminStaff = staffList.find((s) => s.id === "admin-user") || currentStaff;

  const handleLogout = () => {
    saveAuthSession(null);
    setAuthSession(null);
    setActiveTab("HOME");
    soundEffects.playClick();
  };

  const handleOpenAdminRoleModal = () => {
    setAdminRoleInput(adminStaff?.role || "អភិបាលប្រព័ន្ធជាន់ខ្ពស់ (Super Admin)");
    setIsAdminRoleModalOpen(true);
  };

  const handleSaveAdminRole = () => {
    if (!adminRoleInput.trim()) return;
    const updated = staffList.map((s) =>
      s.id === "admin-user" ? { ...s, role: adminRoleInput.trim() } : s
    );
    setStaffList(updated);
    saveStaffList(updated);
    setIsAdminRoleModalOpen(false);
    setRecentSuccessMessage(`បានប្តូរតួនាទី Admin ទៅជា "${adminRoleInput.trim()}" ជោគជ័យ!`);
    setTimeout(() => setRecentSuccessMessage(null), 4000);
  };

  const handleQuickMenuSelect = (
    menu: "ATTENDANCE" | "LEAVE" | "CLOCK" | "CALENDAR" | "SALARY"
  ) => {
    if (menu === "ATTENDANCE") {
      setActiveTab("ATTENDANCE");
    } else if (menu === "LEAVE") {
      setIsLeaveModalOpen(true);
    } else if (menu === "SALARY") {
      if (isAdmin) {
        setActiveTab("SALARY");
      }
    } else if (menu === "CLOCK") {
      const today = new Date();
      const todayStaffRecords = records.filter((r) => {
        const d = new Date(r.timestamp);
        return (
          r.staffId === currentStaff?.id &&
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });
      const hasCheckedIn = todayStaffRecords.some((r) => r.type === "CHECK_IN");
      const hasCheckedOut = todayStaffRecords.some((r) => r.type === "CHECK_OUT");
      if (hasCheckedIn && !hasCheckedOut) {
        setClockAttendanceType("CHECK_OUT");
      } else {
        setClockAttendanceType("CHECK_IN");
      }
      setClockStaffId(currentStaff?.id);
      setActiveTab("CLOCK");
    } else if (menu === "CALENDAR") {
      setIsCalendarModalOpen(true);
    }
  };

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-kantumruy"
      >
        <div className="text-center space-y-4 p-6">
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid rgba(59, 130, 246, 0.2)",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              margin: "0 auto",
            }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
          />
          <div>
            <h2 className="text-sm font-bold text-slate-200">V2 Attendance</h2>
            <p className="text-xs text-slate-400 mt-1">កំពុងផ្ទៀងផ្ទាត់សិទ្ធិចូលប្រើប្រព័ន្ធ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in: Show Unified Portal Login Gate
  if (!authSession) {
    return (
      <PortalLoginGate
        staffList={staffList}
        onLoginSuccess={(session) => {
          saveAuthSession(session);
          setAuthSession(session);
          if (session.role === "STAFF" && session.staffBranchId) {
            setCurrentBranchId(session.staffBranchId);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-kantumruy text-slate-900 dark:text-slate-100 antialiased flex flex-col justify-between selection:bg-blue-500 selection:text-white pb-20">
      {/* Main Mobile App Container */}
      <div className="w-full max-w-md mx-auto p-4 sm:p-5 space-y-4">
        {/* Recent Success Toast */}
        {recentSuccessMessage && (
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white" />
              <span>{recentSuccessMessage}</span>
            </div>
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg text-[11px] transition flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Telegram</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: HOME SCREEN (Image 1 style) */}
        {/* ========================================================= */}
        {activeTab === "HOME" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Bar with Role & Session */}
            <CheckinMeTopBar
              unreadCount={1}
              currentSession={authSession}
              onLogout={handleLogout}
              onOpenTelegram={() => setIsPreviewModalOpen(true)}
              onOpenNotifications={() => setIsLeaveModalOpen(true)}
              onOpenSettings={() => {
                if (isAdmin) setIsSettingsOpen(true);
              }}
            />

            {/* V2 Education Hero Card with My Card button */}
            <CheckinMeHeroCard
              currentStaff={currentStaff}
              currentBranchId={currentBranchId}
              isAdmin={isAdmin}
              onOpenMyCard={() => setIsMyCardModalOpen(true)}
              onQuickScan={() => {
                const today = new Date();
                const todayStaffRecords = records.filter((r) => {
                  const d = new Date(r.timestamp);
                  return (
                    r.staffId === currentStaff?.id &&
                    d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear()
                  );
                });
                const hasCheckedIn = todayStaffRecords.some((r) => r.type === "CHECK_IN");
                const hasCheckedOut = todayStaffRecords.some((r) => r.type === "CHECK_OUT");
                if (hasCheckedIn && !hasCheckedOut) {
                  setClockAttendanceType("CHECK_OUT");
                } else {
                  setClockAttendanceType("CHECK_IN");
                }
                if (currentStaff) setClockStaffId(currentStaff.id);
                setActiveTab("CLOCK");
              }}
            />

            {/* Flagship Bento Grid Quick Menu */}
            <CheckinMeQuickMenu
              onSelectMenu={handleQuickMenuSelect}
              isAdmin={isAdmin}
              currentStaff={currentStaff}
            />

            {/* Today's Attendance Quick Card (● Check-in & ● Check-out) */}
            {(() => {
              const today = new Date();
              const todayRecords = records.filter((r) => {
                const d = new Date(r.timestamp);
                return (
                  r.staffId === currentStaff?.id &&
                  d.getDate() === today.getDate() &&
                  d.getMonth() === today.getMonth() &&
                  d.getFullYear() === today.getFullYear()
                );
              });
              const inRec = todayRecords.find((r) => r.type === "CHECK_IN");
              const outRec = todayRecords.find((r) => r.type === "CHECK_OUT");

              return (
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3.5 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-battambang text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>វត្តមានថ្ងៃនេះ</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {today.toLocaleDateString("km-KH", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ATTENDANCE")}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 group"
                    >
                      <span>កាតលម្អិត</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Check-In Card */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      inRec
                        ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                        : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
                    }`}>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${inRec ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                          <span>ស្កេនចូល</span>
                        </span>
                        {inRec ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                            ✓ បានកត់ត្រា
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">មិនទាន់ស្កេន</span>
                        )}
                      </div>

                      {inRec ? (
                        <div className="flex items-baseline gap-1 pt-0.5">
                          <span className="text-base font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-300">
                            {inRec.formattedTime}
                          </span>
                          <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-sans">
                            (ជោគជ័យ)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => currentStaff && handleDirectRecord("CHECK_IN", currentStaff)}
                            className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-bold transition shadow-xs active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>⚡ ចុចចូល</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setClockAttendanceType("CHECK_IN");
                              if (currentStaff) setClockStaffId(currentStaff.id);
                              setActiveTab("CLOCK");
                            }}
                            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs transition active:scale-95"
                            title="ស្កេន QR តាមកាមេរ៉ា"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Check-Out Card */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      outRec
                        ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
                        : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
                    }`}>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${outRec ? "bg-amber-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                          <span>ស្កេនចេញ</span>
                        </span>
                        {outRec ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                            ✓ បានកត់ត្រា
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">មិនទាន់ស្កេន</span>
                        )}
                      </div>

                      {outRec ? (
                        <div className="flex items-baseline gap-1 pt-0.5">
                          <span className="text-base font-black font-mono tracking-tight text-amber-700 dark:text-amber-300">
                            {outRec.formattedTime}
                          </span>
                          <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-sans">
                            (ជោគជ័យ)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => currentStaff && handleDirectRecord("CHECK_OUT", currentStaff)}
                            className="flex-1 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-[10px] font-bold transition shadow-xs active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>⚡ ចុចចេញ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setClockAttendanceType("CHECK_OUT");
                              if (currentStaff) setClockStaffId(currentStaff.id);
                              setActiveTab("CLOCK");
                            }}
                            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs transition active:scale-95"
                            title="ស្កេន QR តាមកាមេរ៉ា"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Conditional Dashboard: Admin Management Hub vs Staff Personal Hub */}
            {isAdmin ? (
              <>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold font-battambang text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>ផ្ទាំងគ្រប់គ្រង Admin ធំ (Super Admin)</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {V2_BRANCHES[currentBranchId].nameKhmer}
                    </span>
                  </div>

                  {/* High-visibility Dedicated Salary Banner */}
                  <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-4 text-white shadow-md shadow-emerald-600/20 relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase">
                            💵 តារាងប្រាក់ខែបុគ្គលិក
                          </span>
                          <span className="text-xs font-semibold text-emerald-100">
                            {staffList.length} នាក់
                          </span>
                        </div>
                        <div className="text-xl font-black font-sans tracking-tight">
                          ${staffList.reduce((sum, s) => sum + (s.baseSalary ?? 500), 0).toLocaleString()}
                          <span className="text-xs font-normal text-emerald-200 ml-1">/ ខែសរុប</span>
                        </div>
                        <p className="text-[11px] text-emerald-100 font-kantumruy">
                          មើល បញ្ចូល និងកែប្រែប្រាក់ខែ វេនម៉ោង និងកូតាច្បាប់
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("SALARY")}
                        className="px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl text-xs font-bold font-battambang transition shadow-md active:scale-95 shrink-0 flex items-center gap-1"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>បើកតារាង</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Action Cards: Members Profile & Full Payroll Table */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffInitialTab("STAFF");
                        setActiveTab("STAFF");
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition text-left group active:scale-98"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold shadow-xs mb-2 group-hover:scale-105 transition">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="text-xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{staffList.length}</span>
                        <span className="text-[11px] font-semibold text-slate-400">Members</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-battambang mt-0.5">
                        បញ្ជីបុគ្គលិក
                      </div>
                      <div className="text-[10px] text-slate-400 font-kantumruy">
                        ៧ សាខា &amp; តួនាទី
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("SALARY")}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition text-left group active:scale-98"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold shadow-xs mb-2 group-hover:scale-105 transition">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>${Math.round(staffList.reduce((sum, s) => sum + (s.baseSalary ?? 500), 0) / (staffList.length || 1))}</span>
                        <span className="text-[11px] font-semibold text-slate-400">មធ្យម</span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-battambang mt-0.5">
                        តារាងប្រាក់ខែ
                      </div>
                      <div className="text-[10px] text-slate-400 font-kantumruy">
                        កែប្រែ &amp; Export CSV
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dedicated 9:00 PM Daily Accounting Report Banner for Telegram */}
                <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 rounded-3xl p-4 text-white shadow-md shadow-sky-600/20 relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase">
                          ⏰ ម៉ោង ៩:០០ យប់ (21:00)
                        </span>
                        <span className="text-xs font-semibold text-sky-100">
                          គណនេយ្យ
                        </span>
                      </div>
                      <div className="text-sm font-bold font-battambang leading-tight">
                        របាយការណ៍វត្តមានចេញ-ចូលប្រចាំថ្ងៃ
                      </div>
                      <p className="text-[11px] text-sky-100 font-kantumruy">
                        ទម្លាក់ចូល Telegram ជាបញ្ជី ឬ Export ជា PDF/Excel សម្រាប់គណនេយ្យ
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAccountingModalOpen(true)}
                      className="px-3.5 py-2.5 bg-white text-blue-700 hover:bg-sky-50 rounded-2xl text-xs font-bold font-battambang transition shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      <span>បើករបាយការណ៍</span>
                    </button>
                  </div>
                </div>

                {/* Quick Action Pills (Location, Accounting, Salary, QR Stands, & Install) */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-xs transition active:scale-95 group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">
                      ទីតាំង
                    </div>
                    <div className="text-[8px] text-slate-400">GPS 100m</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAccountingModalOpen(true)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-xs transition active:scale-95 group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">
                      របាយការណ៍
                    </div>
                    <div className="text-[8px] text-slate-400">ម៉ោង ៩ យប់</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("SALARY")}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-xs transition active:scale-95 group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">
                      ប្រាក់ខែ
                    </div>
                    <div className="text-[8px] text-slate-400">Payroll</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowStandsSubView(true);
                      setActiveTab("SETTINGS");
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-xs transition active:scale-95 group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">
                      QR សាខា
                    </div>
                    <div className="text-[8px] text-slate-400">Standees</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInstallModalOpen(true)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-xs transition active:scale-95 group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 dark:text-white truncate w-full">
                      ដំឡើង App
                    </div>
                    <div className="text-[8px] text-slate-400">PWA</div>
                  </button>
                </div>
              </>
            ) : (
              /* STAFF EXCLUSIVE PERSONAL HUB: NO SCHOOL INTERNAL DATA */
              <div className="space-y-3 pt-1">
                {/* Staff Schedule & Proximity Card */}
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-battambang text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>កាលវិភាគ & ព័ត៌មានការងារ</span>
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      {V2_BRANCHES[currentStaff?.branchId || "BKK"]?.nameKhmer}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">ម៉ោងបំពេញការងារ</div>
                      <div className="font-bold font-mono text-slate-800 dark:text-slate-100 text-xs">
                        {currentStaff?.checkInTime || "08:00"} - {currentStaff?.checkOutTime || "17:00"}
                      </div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {currentStaff?.shiftHours || 8} ម៉ោង / ថ្ងៃ
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">កូតាសុំច្បាប់ប្រចាំឆ្នាំ</div>
                      <div className="font-bold font-mono text-blue-600 dark:text-blue-400 text-xs">
                        សល់ {(currentStaff?.leaveQuota ?? 18) - (currentStaff?.leaveUsed ?? 0)} ថ្ងៃ
                      </div>
                      <div className="text-[9px] text-slate-400">
                        ប្រើអស់: {currentStaff?.leaveUsed ?? 0}/{currentStaff?.leaveQuota ?? 18} ថ្ងៃ
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Badge */}
                <div className="bg-blue-50/50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-blue-100/60 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    គណនីបុគ្គលិកផ្ទាល់ខ្លួន៖ លោកអ្នកមានសិទ្ធិស្កេនចេញចូល និងពិនិត្យទិន្នន័យផ្ទាល់ខ្លួន។ ព័ត៌មានប្រាក់ខែ និងទិន្នន័យផ្ទៃក្នុងសាលាត្រូវបានការពារសុវត្ថិភាពខ្ពស់។
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ATTENDANCE SCREEN (Image 2 style) */}
        {/* ========================================================= */}
        {activeTab === "ATTENDANCE" && (
          <div className="animate-in fade-in duration-200">
            <AttendanceCardView
              records={records}
              staffList={staffList}
              currentStaff={currentStaff}
              isAdmin={isAdmin}
              onBack={() => setActiveTab("HOME")}
              onClockAction={(type, staffId) => {
                setClockAttendanceType(type);
                if (staffId) setClockStaffId(staffId);
                setActiveTab("CLOCK");
              }}
              onDirectRecord={handleDirectRecord}
              onExportCsv={() => exportAttendanceToCSV(records)}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CLOCK ATTENDANCE SCANNER (QR Camera) */}
        {/* ========================================================= */}
        {activeTab === "CLOCK" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Back Navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("HOME")}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-0.5 transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Home</span>
              </button>
              <h2 className="text-sm font-bold font-battambang text-slate-900 dark:text-white">
                {clockAttendanceType === "CHECK_IN"
                  ? "ស្កេនវត្តមានចូល (Check-In)"
                  : "ស្កេនវត្តមានចេញ (Check-Out)"}
              </h2>
              <div className="w-10" />
            </div>

            {/* Attendance Camera Viewfinder */}
            <AttendanceScanner
              currentBranchId={currentBranchId}
              onBranchChange={(id) => setCurrentBranchId(id)}
              staffList={staffList}
              currentStaff={currentStaff}
              isAdmin={isAdmin}
              branchLocations={branchLocations}
              initialAttendanceType={clockAttendanceType}
              initialStaffId={clockStaffId}
              onAttendanceSubmitted={handleAttendanceSubmitted}
              onOpenSettings={() => {
                if (isAdmin) setIsSettingsOpen(true);
              }}
              onOpenLocationSettings={() => {
                if (isAdmin) setIsLocationModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* DEDICATED TAB: SALARY & PAYROLL MANAGEMENT (ADMIN ONLY) */}
        {/* ========================================================= */}
        {activeTab === "SALARY" && (
          isAdmin ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <SalaryManagement
                onStaffUpdated={(newList) => setStaffList(newList)}
                onBack={() => setActiveTab("HOME")}
                onOpenAddStaff={() => {
                  setStaffInitialTab("STAFF");
                  setActiveTab("STAFF");
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mx-auto">
                🔒
              </div>
              <h3 className="font-bold text-base font-battambang text-slate-800 dark:text-white">
                ទិន្នន័យផ្ទៃក្នុងសាលា (Internal School Data)
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                លោកអ្នកមិនមានសិទ្ធិចូលមើលតារាងប្រាក់ខែបុគ្គលិក ឬទិន្នន័យហិរញ្ញវត្ថុរបស់សាលាឡើយ។
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("HOME")}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-500 transition"
              >
                ត្រឡប់ទៅទំព័រដើម
              </button>
            </div>
          )
        )}

        {/* ========================================================= */}
        {/* TAB 4: STAFF MANAGEMENT (ADMIN ONLY) */}
        {/* ========================================================= */}
        {activeTab === "STAFF" && (
          isAdmin ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <StaffManagement
                onStaffUpdated={(newList) => setStaffList(newList)}
                onBack={() => setActiveTab("HOME")}
                initialTab={staffInitialTab}
              />
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mx-auto">
                🔒
              </div>
              <h3 className="font-bold text-base font-battambang text-slate-800 dark:text-white">
                បញ្ជីបុគ្គលិកផ្ទៃក្នុង (Staff Directory Restricted)
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                លោកអ្នកមិនមានសិទ្ធិចូលមើលបញ្ជីបុគ្គលិក ឬកែប្រែព័ត៌មានបុគ្គលិកដទៃទៀតឡើយ។
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("HOME")}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-500 transition"
              >
                ត្រឡប់ទៅទំព័រដើម
              </button>
            </div>
          )
        )}

        {/* ========================================================= */}
        {/* TAB 5: SETTINGS & ADMIN */}
        {/* ========================================================= */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setShowStandsSubView(false);
                  setActiveTab("HOME");
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-0.5 transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Home</span>
              </button>
              <h2 className="text-sm font-bold font-battambang text-slate-900 dark:text-white">
                {showStandsSubView ? "កូដ QR សាខាទាំង ៧" : "ការកំណត់ & គណនី"}
              </h2>
              <div className="w-10" />
            </div>

            {showStandsSubView ? (
              <BranchQRStands />
            ) : isAdmin ? (
              <div className="space-y-4">
                {/* Admin Profile Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xl ring-4 ring-amber-500/10 shrink-0">
                        👑
                      </div>
                      <div>
                        <div className="text-sm font-bold font-battambang text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{adminStaff?.name || "Admin (អ្នកគ្រប់គ្រង)"}</span>
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold font-sans">
                          {adminStaff?.role || "អភិបាលប្រព័ន្ធជាន់ខ្ពស់ (Super Admin)"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          V2 Education • ៧ សាខាទូទាំងកម្ពុជា
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAdminRoleModal}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs"
                      title="ចុចដើម្បីវាយប្តូរតួនាទី Admin"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>វាយប្តូរតួនាទី</span>
                    </button>
                  </div>
                </div>

                {/* Branch Selection */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    សាខាកំពុងជ្រើសរើស (Active Branch)
                  </label>
                  <select
                    value={currentBranchId}
                    onChange={(e) => setCurrentBranchId(e.target.value as BranchId)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {BRANCH_LIST.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameKhmer} ({b.id}) - {b.addressKhmer}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
                  {/* Location & GPS Settings */}
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white font-battambang">
                          កំណត់ទីតាំងសាខា & GPS Geofence
                        </div>
                        <div className="text-[10px] text-slate-400">
                          កូអរដោនេ, កាំស្កេន និងកំណត់យកទីតាំងខ្ញុំពេលនេះ
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowStandsSubView(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white font-battambang">
                        កូដ QR សាខាទាំង ៧ (Standees)
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white font-battambang">
                        កំណត់ Telegram Bot & GPS Simulation
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInstallModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        របៀបដំឡើង App លើទូរស័ព្ទដៃ (PWA)
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold font-battambang transition flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900 shadow-2xs active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ចាកចេញពីគណនី Admin (Log Out)</span>
                </button>
              </div>
            ) : (
              /* Staff Settings / Profile View */
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
                      {currentStaff?.avatarUrl ? (
                        <img
                          src={currentStaff.avatarUrl}
                          alt={currentStaff.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        currentStaff?.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold font-battambang text-slate-900 dark:text-white truncate">
                        {currentStaff?.name}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        {currentStaff?.role}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {V2_BRANCHES[currentStaff?.branchId || "BKK"]?.nameKhmer}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">លេខកូដសម្គាល់៖</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {currentStaff?.code || currentStaff?.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">វេនម៉ោងការងារ៖</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {currentStaff?.checkInTime} - {currentStaff?.checkOutTime} ({currentStaff?.shiftHours || 8} ម៉ោង)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">កូតាច្បាប់ AI សរុប៖</span>
                      <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {currentStaff?.leaveQuota ?? 18} ថ្ងៃ
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMyCardModalOpen(true)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>កាតសម្គាល់ QR ខ្ញុំ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCalendarModalOpen(true)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      <span>ប្រតិទិនការងារ</span>
                    </button>
                  </div>
                </div>

                {/* Install App Shortcut */}
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white font-battambang">
                        របៀបដំឡើង App លើទូរស័ព្ទដៃ (PWA)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ដំឡើងចូលទូរស័ព្ទប្រើបានលឿន ដូច App ធម្មតា
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold font-battambang transition flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900 shadow-2xs active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ចាកចេញពីគណនី (Log Out)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Image 1 style) */}
      {/* ========================================================= */}
      <CheckinMeBottomNav
        activeTab={activeTab}
        isAdmin={isAdmin}
        onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
        onChangeTab={(tab) => {
          setShowStandsSubView(false);
          if (tab === "STAFF") {
            setStaffInitialTab("STAFF");
          }
          setActiveTab(tab);
        }}
      />

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        staffList={staffList}
        currentStaff={currentStaff}
        isAdmin={isAdmin}
        onClose={() => setIsLeaveModalOpen(false)}
        onSubmitSuccess={() => {
          const reloaded = loadStaffList();
          setStaffList(reloaded);
        }}
      />

      {/* 2. Calendar View Modal */}
      <CalendarViewModal
        isOpen={isCalendarModalOpen}
        currentStaff={currentStaff}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* 3. My Card Modal (Staff QR Badge) */}
      {currentStaff && (
        <MyCardModal
          isOpen={isMyCardModalOpen}
          staff={currentStaff}
          onClose={() => setIsMyCardModalOpen(false)}
        />
      )}

      {/* 4. Settings Modal (Telegram & GPS) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 5. Telegram Preview Modal */}
      <TelegramPreviewModal
        record={previewRecord}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        isSimulated={lastSubmissionWasSimulated}
      />

      {/* 6. Install to Mobile Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* 7. Branch Location & GPS Geofence Modal */}
      <BranchLocationModal
        isOpen={isLocationModalOpen}
        activeBranchId={currentBranchId}
        onClose={() => setIsLocationModalOpen(false)}
        onBranchUpdated={(updated) => setBranchLocations(updated)}
      />

      {/* 8. Admin Role Custom Edit Modal */}
      {isAdminRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-battambang text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>វាយកំណត់តួនាទី Admin</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  សម្រាប់គណនី: <b className="text-slate-800 dark:text-slate-200">{adminStaff?.name}</b>
                </p>
              </div>
              <button
                onClick={() => setIsAdminRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 font-battambang">
                  វាយបញ្ចូលតួនាទីថ្មី (Type Custom Role)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={adminRoleInput}
                    onChange={(e) => setAdminRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveAdminRole();
                      }
                    }}
                    placeholder="ឧ. អភិបាលប្រព័ន្ធជាន់ខ្ពស់, CEO / ស្ថាបនិក,..."
                    className="w-full text-xs font-semibold px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  {adminRoleInput && (
                    <button
                      type="button"
                      onClick={() => setAdminRoleInput("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>តួនាទីពេញនិយម:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {[
                    "អភិបាលប្រព័ន្ធជាន់ខ្ពស់ (Super Admin)",
                    "ស្ថាបនិក & នាយកប្រតិបត្តិ (Founder & CEO)",
                    "ប្រធានគ្រប់គ្រងទូទៅ (General Manager)",
                    "នាយកផ្នែកសិក្សាធិការ (Academic Director)",
                    "ប្រធានសាខា",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdminRoleInput(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border transition font-medium ${
                        adminRoleInput === preset
                          ? "bg-amber-500 text-white border-amber-500 font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdminRole}
                  disabled={!adminRoleInput.trim()}
                  className="px-5 py-2.5 text-xs font-bold font-battambang bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>រក្សាទុកតួនាទី</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 📊 Daily 9:00 PM Accounting Attendance Report Modal */}
      <DailyAccountingReportModal
        isOpen={isAccountingModalOpen}
        onClose={() => setIsAccountingModalOpen(false)}
        records={records}
        staffList={staffList}
        currentBranchId={currentBranchId}
      />
    </div>
  );
}
