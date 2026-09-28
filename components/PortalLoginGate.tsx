"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Staff, AuthSession, UserRole, Branch } from "@/types";
import { verifyCredentials, loadStaffList } from "@/lib/storage";
import { BRANCH_LIST, V2_BRANCHES } from "@/lib/branches";
import { soundEffects } from "@/lib/audio";
import {
  Crown,
  User,
  ShieldCheck,
  Lock,
  ArrowRight,
  KeyRound,
  Sparkles,
  AlertCircle,
  Mail,
  Phone,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MapPin,
  ExternalLink,
  Send,
  Zap,
  Building,
  X,
} from "lucide-react";

interface PortalLoginGateProps {
  onLoginSuccess: (session: AuthSession) => void;
  initialRole?: UserRole;
  staffList?: Staff[];
}

export const PortalLoginGate: React.FC<PortalLoginGateProps> = ({
  onLoginSuccess,
  initialRole,
  staffList: propStaffList,
}) => {
  // Mode: "QUICK" (2 fields) vs "FULL" (4 fields)
  const [mode, setMode] = useState<"QUICK" | "FULL">("QUICK");

  // Quick mode input: Single identifier (Email / Phone / Code) + PIN
  const [identifier, setIdentifier] = useState("udomkeo71@gmail.com");
  const [quickPin, setQuickPin] = useState("6666");

  // Full mode inputs
  const [email, setEmail] = useState("udomkeo71@gmail.com");
  const [phone, setPhone] = useState("0965268491");
  const [code, setCode] = useState("1234");
  const [pin, setPin] = useState("6666");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Branch Directory Modal
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Auto-fill from URL query param if present (?code=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code") || params.get("admin") || params.get("staff");
      if (urlCode && urlCode !== "1" && urlCode !== "scan") {
        const cleanUpper = urlCode.toUpperCase();
        setCode(cleanUpper);
        setIdentifier(cleanUpper);
      }
    }
  }, []);

  // Quick Login Handler
  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdent = identifier.trim();
    const cleanPinVal = quickPin.trim();

    if (!cleanIdent) {
      setErrorMessage("សូមបញ្ចូល Email, លេខទូរស័ព្ទ ឬ លេខកូដសម្គាល់");
      try { soundEffects.playError(); } catch {}
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Analyze identifier: is it email, phone, or code?
      let inEmail = "";
      let inPhone = "";
      let inCode = cleanIdent;

      if (cleanIdent.includes("@")) {
        inEmail = cleanIdent;
      } else if (cleanIdent.replace(/\D/g, "").length >= 8) {
        inPhone = cleanIdent;
      }

      const res = verifyCredentials(inCode, cleanPinVal, inEmail, inPhone);
      setIsLoading(false);

      if (res.success && res.session) {
        try { soundEffects.playSuccess(); } catch {}
        onLoginSuccess(res.session);
      } else {
        try { soundEffects.playError(); } catch {}
        setErrorMessage(res.error || "ព័ត៌មានមិនត្រឹមត្រូវឡើយ! សូមពិនិត្យឡើងវិញ។");
      }
    }, 200);
  };

  // Full 4-Field Login Handler
  const handleFullLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanCode = code.trim();
    const cleanPin = pin.trim();

    setIsLoading(true);

    setTimeout(() => {
      const res = verifyCredentials(cleanCode, cleanPin, cleanEmail, cleanPhone);
      setIsLoading(false);

      if (res.success && res.session) {
        try { soundEffects.playSuccess(); } catch {}
        onLoginSuccess(res.session);
      } else {
        try { soundEffects.playError(); } catch {}
        setErrorMessage(res.error || "ព័ត៌មានមិនត្រឹមត្រូវឡើយ!");
      }
    }, 200);
  };

  // 1-Tap Fast Entry Actions
  const handleFastLoginAsAdmin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const res = verifyCredentials("1234", "6666", "udomkeo71@gmail.com", "0965268491");
      setIsLoading(false);
      if (res.success && res.session) {
        try { soundEffects.playSuccess(); } catch {}
        onLoginSuccess(res.session);
      }
    }, 150);
  };

  const handleFastLoginAsStaff = () => {
    setIsLoading(true);
    setTimeout(() => {
      const res = verifyCredentials("V2-BKK02", "1234", "tot.chhay@v2education.com", "089 987 654");
      setIsLoading(false);
      if (res.success && res.session) {
        try { soundEffects.playSuccess(); } catch {}
        onLoginSuccess(res.session);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 font-kantumruy flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Branding */}
        <div className="text-center space-y-2.5">
          <div className="w-20 h-20 rounded-3xl bg-white p-2.5 mx-auto shadow-2xl ring-4 ring-blue-500/20 flex items-center justify-center">
            <Image
              src="/v2_n.png"
              alt="V2 Education"
              width={72}
              height={72}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ច្រកសុវត្ថិភាពផ្លូវការ (Official V2 Portal)</span>
            </div>
            <h1 className="text-2xl font-black font-sans tracking-tight text-white flex items-center justify-center gap-1.5">
              <span>V2a</span>
              <span className="text-blue-500">Attendence</span>
            </h1>
            <p className="text-xs text-slate-400 font-battambang mt-0.5">
              ប្រព័ន្ធកត់ត្រាវត្តមាន &amp; គ្រប់គ្រងបុគ្គលិក V2 Education
            </p>
          </div>
        </div>

        {/* 1-Tap Fast Entry Bar (Super Easy!) */}
        <div className="bg-gradient-to-r from-amber-500/20 via-blue-500/20 to-indigo-500/20 border border-slate-700/80 rounded-2xl p-3 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>ចូលរហ័ស ១-ប៉ក់ (Instant 1-Tap Entry)</span>
            </span>
            <span className="text-[10px] text-slate-400">មិនបាច់វាយកូដ</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFastLoginAsAdmin}
              disabled={isLoading}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold font-battambang shadow-md shadow-amber-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Crown className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="truncate">Admin (កែវ ឧត្តម)</span>
            </button>

            <button
              type="button"
              onClick={handleFastLoginAsStaff}
              disabled={isLoading}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-battambang shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <span className="truncate">បុគ្គលិកទូទៅ</span>
            </button>
          </div>
        </div>

        {/* Main Entry Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/70">
            <button
              type="button"
              onClick={() => { setMode("QUICK"); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
                mode === "QUICK"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ ចូលរហ័ស (ងាយស្រួល)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode("FULL"); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
                mode === "FULL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🛡️ ចូលពេញលេញ (៤ ជាន់)</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2 animate-in shake duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: QUICK LOGIN (Only 2 fields: Identifier + PIN) */}
          {/* ======================================================== */}
          {mode === "QUICK" ? (
            <form onSubmit={handleQuickLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-battambang">
                  <span>Email, លេខទូរស័ព្ទ ឬ លេខកូដ App <span className="text-rose-400">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="udomkeo71@gmail.com ឬ 0965268491"
                    className="w-full text-xs font-semibold pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-400 font-battambang pl-1">
                  💡 បញ្ចូល Gmail ផ្ទាល់ខ្លួន, លេខទូរស័ព្ទ, ឬលេខកូដ (ឧ. 1234)
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-battambang">
                  <span>លេខកូដសម្ងាត់ PIN (Passcode) <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-mono">PIN: 6666 ឬ 1234</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={quickPin}
                    onChange={(e) => setQuickPin(e.target.value)}
                    placeholder="បញ្ចូល PIN របស់អ្នក"
                    className="w-full text-xs font-semibold pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder:text-slate-500 font-mono tracking-widest"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-bold font-battambang text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 mt-2"
              >
                {isLoading ? (
                  <span>កំពុងចូលប្រើប្រាស់...</span>
                ) : (
                  <>
                    <span>ចូលប្រើប្រាស់ App (Log In)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ======================================================== */
            /* TAB 2: FULL 4-FACTOR FORM */
            /* ======================================================== */
            <form onSubmit={handleFullLogin} className="space-y-3">
              {/* 1. PERSONAL EMAIL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-battambang">
                  <span>១. អ៊ីមែលផ្ទាល់ខ្លួនប្រចាំថ្ងៃ (Gmail) <span className="text-rose-400">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="udomkeo71@gmail.com"
                    className="w-full text-xs font-semibold pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* 2. PHONE NUMBER */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-battambang">
                  <span>២. លេខទូរស័ព្ទ (Phone Number) <span className="text-rose-400">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0965268491"
                    className="w-full text-xs font-semibold pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* 3. APP CODE */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-battambang">
                  <span>៣. លេខកូដ App (App Code) <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400">ឧ. 1234 ឬ ADMIN2026</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="1234"
                    className="w-full text-sm font-bold font-mono tracking-wider pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* 4. PIN */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between font-battambang">
                  <span>៤. លេខសម្ងាត់ PIN ផ្ទាល់ខ្លួន (Passcode) <span className="text-rose-400">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="6666"
                    className="w-full text-xs font-semibold pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono tracking-widest"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-bold font-battambang text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 mt-2"
              >
                {isLoading ? (
                  <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                ) : (
                  <>
                    <span>ចូលរួម &amp; ស្កេនវត្តមាន (Secure Login)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Helper Toggle */}
          <div className="pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition py-1"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>💡 ជំនួយគណនី (Click to Auto-fill)</span>
              </span>
              {showHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHelp && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg">
                  <div>
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>លោក កែវ ឧត្តម (Admin)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Email: <b>udomkeo71@gmail.com</b> | PIN: <b>6666</b>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("udomkeo71@gmail.com");
                      setQuickPin("6666");
                      setEmail("udomkeo71@gmail.com");
                      setPhone("0965268491");
                      setCode("1234");
                      setPin("6666");
                    }}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-semibold transition"
                  >
                    បំពេញអូតូ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: 7 Branches & Install App */}
          <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowBranchModal(true)}
              className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 ទីតាំងសាខាទាំង ៧</span>
            </button>

            <Link
              href="/install"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📲 ដំឡើង App</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500">
          © 2026 V2 Education • V2aAttendence Management System • Secured Portal
        </p>
      </div>

      {/* ======================================================== */}
      {/* 7 BRANCHES LOCATION & CONTACT DIRECTORY MODAL (Image 1) */}
      {/* ======================================================== */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-battambang leading-tight">
                    ទីតាំង &amp; ទំនាក់ទំនងសាខាទាំង ៧ (V2 Education)
                  </h3>
                  <p className="text-[11px] text-amber-100">
                    ព័ត៌មានលម្អិតផ្លូវការតាមសាខានីមួយៗ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBranchModal(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 7 Branches List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {BRANCH_LIST.map((branch) => (
                <div
                  key={branch.id}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: branch.color }}
                      >
                        {branch.id}
                      </span>
                      <div>
                        <div className="text-xs font-bold font-battambang text-white">
                          {branch.nameKhmer}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {branch.nameEnglish}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-semibold flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>ផែនទី</span>
                    </a>
                  </div>

                  {/* Address */}
                  <div className="text-xs text-slate-300 flex items-start gap-1.5 pl-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{branch.addressEnglish || branch.addressKhmer}</span>
                  </div>

                  {/* Telegram & Facebook */}
                  <div className="pt-2 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-blue-300">
                      <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{branch.telegram || branch.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        f
                      </span>
                      <span className="truncate">{branch.facebookPage}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-center">
              <button
                type="button"
                onClick={() => setShowBranchModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-battambang text-xs font-semibold rounded-xl transition"
              >
                បិទផ្ទាំង (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
