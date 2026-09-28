"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  QrCode,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import QRCode from "qrcode";
import { soundEffects } from "@/lib/audio";

export default function InstallAppPage() {
  const [activeOS, setActiveOS] = useState<"ios" | "android">("android");
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fullUrl = window.location.origin;
      setCurrentUrl(fullUrl);

      // Check if running in standalone mode (already installed app)
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      // Detect OS
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActiveOS("ios");
      } else {
        setActiveOS("android");
      }

      // Listen for Android beforeinstallprompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      // Generate QR Code for mobile install
      QRCode.toDataURL(fullUrl, {
        width: 260,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    soundEffects.playClick();
    if (deferredPrompt) {
      const prompt = deferredPrompt as {
        prompt: () => void;
        userChoice: Promise<{ outcome: string }>;
      };
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (activeOS === "ios") {
      alert("ចំពោះ iPhone (iOS)៖ សូមចុចលើប៊ូតុង Share (សញ្ញាចែករំលែក ខាងក្រោម Safari) រួចរំកិលចុច 'បន្ថែមទៅអេក្រង់ដើម (Add to Home Screen)'");
    } else {
      alert("ចំពោះ Android៖ សូមចុចសញ្ញាចុចបី (⋮) នៅជ្រុងលើ Chrome រួចជ្រើសរើស 'ដំឡើងកម្មវិធី (Install app)' ឬ 'Add to Home screen'");
    }
  };

  const handleCopyOfficialLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(currentUrl || window.location.origin).then(() => {
      soundEffects.playSuccess();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white font-kantumruy flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-xl mx-auto space-y-6 pt-4 pb-12 animate-in fade-in duration-300">
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-24 h-24 rounded-3xl bg-white p-3 mx-auto shadow-2xl ring-4 ring-blue-500/20 flex items-center justify-center transform hover:scale-105 transition">
            <Image
              src="/v2_n.png"
              alt="V2 Education Logo"
              width={80}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Link ផ្លូវការសម្រាប់ដំឡើង App (Official PWA)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white flex items-center justify-center gap-2">
              <span>V2a</span>
              <span className="text-blue-500">Attendence</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 font-battambang mt-1 max-w-md mx-auto">
              ប្រព័ន្ធកត់ត្រាវត្តមានបុគ្គលិក ៧ សាខា & ផ្ទៀងផ្ទាត់ GPS Geofencing ១០០ ម៉ែត្រ
            </p>
          </div>
        </div>

        {/* Installation Status Banner */}
        {isStandalone ? (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>លោកអ្នកកំពុងប្រើប្រាស់ App លើទូរស័ព្ទដៃរួចរាល់ហើយ!</span>
            </div>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <span>ចូលប្រើ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  ដំឡើងលើទូរស័ព្ទដៃ (Mobile App)
                </span>
                <div className="text-base font-bold font-battambang pt-1">
                  ចុចដំឡើង App លើទូរស័ព្ទដៃរបស់អ្នក
                </div>
              </div>
              <Smartphone className="w-8 h-8 text-amber-300" />
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-bold font-battambang text-sm transition shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>📲 ចុចដំឡើង App ឥឡូវនេះ (Install App)</span>
            </button>
          </div>
        )}

        {/* Auto-Update Guarantee Card (Crucial User Requirement) */}
        <div className="bg-slate-800/90 border border-blue-500/30 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>ប្រព័ន្ធអាប់ដេតស្វ័យប្រវត្តិ (Automatic Live Update Guarantee)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            រាល់ពេលមានការកែប្រែ បន្ថែមមុខងារ ឬ update ប្រព័ន្ធពីចម្ងាយ៖{" "}
            <b className="text-emerald-300">
              App លើទូរស័ព្ទដៃរបស់លោកអ្នកនឹង Update ដោយស្វ័យប្រវត្តិតាមរយៈ Service Worker
            </b>{" "}
            ដោយមិនចាំបាច់លុប ឬដំឡើងឡើងវិញម្តងទៀតឡើយ!
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Update អូតូពេលបើក App</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>មិនស៊ីទំហំទូរស័ព្ទ (ស្រាល & រហ័ស)</span>
            </div>
          </div>
        </div>

        {/* Step-by-Step OS Installation Guide */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <span className="text-xs font-bold text-white font-battambang">
              សៀវភៅណែនាំដំឡើងតាមប្រភេទឧបករណ៍ (Select OS)
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveOS("android")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeOS === "android"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setActiveOS("ios")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeOS === "ios"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                iPhone (iOS)
              </button>
            </div>
          </div>

          {activeOS === "ios" ? (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">បើកវេបសាយតាមកម្មវិធី Safari លើ iPhone</span>
                  <p className="text-slate-400 text-[11px]">ត្រូវប្រាកដថាប្រើ Safari (មិនមែន Chrome ឬ Facebook Browser ទេ)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                    <span>ចុចលើប៊ូតុងចែករំលែក (Share Icon)</span>
                    <Share className="w-4 h-4 text-blue-400 inline" />
                  </span>
                  <p className="text-slate-400 text-[11px]">ប៊ូតុងសញ្ញាព្រួញចង្អុលឡើងលើ នៅចំកណ្តាលផ្នែកខាងក្រោមនៃ Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                    <span>រំកិលចុះក្រោម រួចចុច "បន្ថែមទៅអេក្រង់ដើម"</span>
                    <PlusSquare className="w-4 h-4 text-blue-400 inline" />
                  </span>
                  <p className="text-slate-400 text-[11px]">ជ្រើសរើស <b>"Add to Home Screen"</b> រួចចុច <b>"Add (បន្ថែម)"</b> នៅជ្រុងលើខាងស្តាំ</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">បើកវេបសាយតាមកម្មវិធី Google Chrome</span>
                  <p className="text-slate-400 text-[11px]">ដំណើរការលើទូរស័ព្ទ Samsung, Oppo, Vivo, Xiaomi, etc.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                    <span>ចុចសញ្ញាចុចបី (⋮) Menu</span>
                    <MoreVertical className="w-4 h-4 text-emerald-400 inline" />
                  </span>
                  <p className="text-slate-400 text-[11px]">ស្ថិតនៅជ្រុងលើខាងស្តាំនៃ Chrome</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                    <span>ជ្រើសរើស "ដំឡើងកម្មវិធី" (Install app)</span>
                    <Download className="w-4 h-4 text-emerald-400 inline" />
                  </span>
                  <p className="text-slate-400 text-[11px]">ចុច "Install" នោះ App នឹងបង្ហាញលើអេក្រង់ទូរស័ព្ទភ្លាមៗ</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Section for Mobile Scanning */}
        {qrCodeDataUrl && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-white">
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>ស្កេនកូដ QR នេះតាមកាមេរ៉ាទូរស័ព្ទ ដើម្បីបើក & ដំឡើងភ្លាមៗ</span>
            </div>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-md">
              <img
                src={qrCodeDataUrl}
                alt="QR Code Install App"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              បើកកាមេរ៉ាទូរស័ព្ទរបស់អ្នក តម្រង់លើ QR នេះ ដើម្បីបើកទំព័រដំឡើង App លើទូរស័ព្ទ
            </p>
          </div>
        )}

        {/* Action Buttons: Copy Link & Open Web App */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyOfficialLink}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 active:scale-98 shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>បានចម្លងរួច ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-400" />
                <span>ចម្លង Link ផ្ញើតាម Chat</span>
              </>
            )}
          </button>

          <Link
            href="/"
            className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-blue-600/25"
          >
            <span>ចូលប្រើប្រព័ន្ធ Web</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-4 border-t border-slate-800">
        © 2026 V2 Education • V2aAttendence Management System • កំណែផ្លូវការ PWA
      </footer>
    </div>
  );
}
