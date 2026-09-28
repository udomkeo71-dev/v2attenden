"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, MoreVertical, PlusSquare, Check } from "lucide-react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [activeOS, setActiveOS] = useState<"ios" | "android">("android");
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed / standalone
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Detect iOS vs Android automatically
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActiveOS("ios");
      } else {
        setActiveOS("android");
      }

      // Capture Android install prompt
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      });
    }
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-battambang text-white">
                របៀបដំឡើង Web App លើទូរស័ព្ទដៃ
              </h3>
              <p className="text-[11px] text-slate-400">Add to Home Screen ដូច App ទូទៅ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OS Selector Tabs */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveOS("android")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeOS === "android"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🤖 ទូរស័ព្ទ Android (Samsung, etc.)</span>
          </button>
          <button
            onClick={() => setActiveOS("ios")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeOS === "ios"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🍏 ទូរស័ព្ទ iPhone (iOS)</span>
          </button>
        </div>

        {/* Guide Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
          {activeOS === "android" ? (
            <div className="space-y-3">
              {deferredPrompt ? (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-battambang transition flex items-center justify-center gap-2 shadow-lg mb-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ចុចទីនេះដើម្បីដំឡើងភ្លាមៗ (Install Now)</span>
                </button>
              ) : null}

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-slate-700 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-white block mb-0.5">បើកវេបសាយតាមកម្មវិធី Google Chrome</span>
                  <span>ចូលទៅកាន់ Link <b>attendencv2.vercel.app/scan</b></span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-slate-700 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-white block mb-0.5 flex items-center gap-1">
                    <span>ចុចលើសញ្ញាចុចបី</span>
                    <MoreVertical className="w-4 h-4 text-emerald-400 inline" />
                    <span>នៅជ្រុងលើខាងស្តាំ</span>
                  </span>
                  <span>ចុចលើ Menu របស់ Chrome នៅផ្នែកខាងលើ</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-slate-700 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-white block mb-0.5">
                    រើសយក &quot;Add to Home screen&quot; (ឬ &quot;ដំឡើងកម្មវិធី&quot;)
                  </span>
                  <span>រួចចុចពាក្យ <b>Install</b> ឬ <b>Add</b> ជាការស្រេច!</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-slate-700 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-white block mb-0.5">បើកវេបសាយតាមកម្មវិធី Safari</span>
                  <span>(ត្រូវប្រាកដថាបើកក្នុងកម្មវិធី Safari មិនមែន Chrome ឡើយ)</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-slate-700 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-white block mb-0.5 flex items-center gap-1">
                    <span>ចុចប៊ូតុង Share</span>
                    <Share className="w-4 h-4 text-blue-400 inline" />
                    <span>(សញ្ញាប្រអប់ព្រួញឡើងលើ)</span>
                  </span>
                  <span>នៅផ្នែកខាងក្រោមនៃអេក្រង់ Safari</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-slate-700 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-white block mb-0.5 flex items-center gap-1">
                    <span>អូសចុះក្រោម រើសយក</span>
                    <PlusSquare className="w-4 h-4 text-blue-400 inline" />
                    <span>&quot;Add to Home Screen&quot;</span>
                  </span>
                  <span>(បន្ថែមទៅអេក្រង់ដើម) រួចចុចពាក្យ <b>Add</b> នៅជ្រុងលើស្តាំ</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-[11px] text-blue-300">
            ✨ បន្ទាប់ពីបន្ថែមរួច កម្មវិធីនឹងបង្ហាញរូប Icon ឈ្មោះ <b>&quot;V2aAttendence&quot;</b> លើអេក្រង់ទូរស័ព្ទរបស់អ្នក ដូច App ទូទៅដែរ!
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            យល់ព្រម (បិទ)
          </button>
        </div>
      </div>
    </div>
  );
};
