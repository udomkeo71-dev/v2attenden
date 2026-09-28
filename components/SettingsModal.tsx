import React, { useState, useEffect } from "react";
import { AppSettings, loadSettings, saveSettings, getAdminMasterCode, saveAdminMasterCode } from "@/lib/storage";
import { X, Key, Send, MapPin, Check, AlertCircle, Loader2, Crown, KeyRound } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [adminMasterCode, setAdminMasterCode] = useState<string>("8888");
  const [testTelegramLoading, setTestTelegramLoading] = useState(false);
  const [testTelegramMsg, setTestTelegramMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      setAdminMasterCode(getAdminMasterCode());
      setTestTelegramMsg(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSettings(settings);
    if (adminMasterCode.trim()) {
      saveAdminMasterCode(adminMasterCode.trim());
    }
    setSavedSuccess(true);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestTelegram = async () => {
    setTestTelegramLoading(true);
    setTestTelegramMsg(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          message: "Test ping",
          isTest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestTelegramMsg({
          type: "success",
          text: "✅ បានភ្ជាប់ជោគជ័យ! សារតេស្តត្រូវបានផ្ញើទៅកាន់ Telegram Group របស់អ្នកហើយ។",
        });
      } else {
        setTestTelegramMsg({
          type: "error",
          text: `❌ ${data.error || "មិនអាចភ្ជាប់បានទេ សូមពិនិត្យ Token និង Chat ID"}`,
        });
      }
    } catch {
      setTestTelegramMsg({
        type: "error",
        text: "❌ មិនអាចទាក់ទងទៅ Telegram API បានទេ",
      });
    } finally {
      setTestTelegramLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden font-kantumruy">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white font-battambang">
                ការកំណត់ប្រព័ន្ធ (System Settings)
              </h2>
              <p className="text-xs text-slate-500">
                កំណត់ API Keys, Telegram Bot និងឧបករណ៍ GPS Simulator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Admin ធំ Master Passcode Section */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-300 dark:border-amber-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 font-battambang">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>លេខកូដសម្ងាត់ Admin ធំ (Master Admin Code)</span>
              </label>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                👑 សិទ្ធិគ្រប់គ្រងកំពូល
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminMasterCode}
                onChange={(e) => setAdminMasterCode(e.target.value)}
                placeholder="ឧ. 8888 ឬ V2ADMIN"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white font-mono font-bold tracking-wider focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
              * ប្រើកូដនេះ ឬ Link <code>?code={adminMasterCode || "8888"}</code> ដើម្បីចូលកាន់ Admin ធំ មានសិទ្ធិមើលនិងគ្រប់គ្រងទិន្នន័យគ្រប់សាខា ប្រាក់ខែ និងបុគ្គលិកទាំងអស់។
            </p>
          </div>

          {/* GPS Simulation Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>របៀបតេស្ត GPS Geofencing (GPS Test Mode)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, gpsSimMode: "INSIDE" })}
                className={`py-2 px-2 text-xs rounded-xl border text-center transition font-medium ${
                  settings.gpsSimMode === "INSIDE"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="font-bold">🏢 ក្នុងសាខា</div>
                <div className="text-[10px] text-slate-500 mt-0.5">~15 ម៉ែត្រ (ជាប់)</div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, gpsSimMode: "OUTSIDE" })}
                className={`py-2 px-2 text-xs rounded-xl border text-center transition font-medium ${
                  settings.gpsSimMode === "OUTSIDE"
                    ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="font-bold">⛔ ក្រៅសាខា</div>
                <div className="text-[10px] text-slate-500 mt-0.5">~350m (ជាប់សោរ)</div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, gpsSimMode: "REAL" })}
                className={`py-2 px-2 text-xs rounded-xl border text-center transition font-medium ${
                  settings.gpsSimMode === "REAL"
                    ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="font-bold">🛰️ GPS ពិត</div>
                <div className="text-[10px] text-slate-500 mt-0.5">ឧបករណ៍ផ្ទាល់</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              * បទបញ្ជាផ្លូវការ៖ <b>រាល់ការស្កេនចេញ ឬស្កេនចូល ត្រូវតែក្នុងកាំកំណត់ ១០០ ម៉ែត្រ</b> (បើលើសពី ១០០m ប្រព័ន្ធនឹងបដិសេធមិនអនុញ្ញាតឱ្យស្កេនជាដាច់ខាត)។
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-500" />
                <span>Google Gemini API Key (Vision / Anti-Spoofing)</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline"
              >
                ទទួលយក Key ដោយឥតគិតថ្លៃ ↗
              </a>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500">
              * បើមិនទាន់មាន Key ប្រព័ន្ធនឹងដំណើរការ AI Simulator ដោយស្វ័យប្រវត្តិ។
            </p>
          </div>

          {/* Telegram Bot Token & Chat ID */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Telegram Bot Notifications</span>
            </label>
            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Telegram Bot Token:</span>
                <input
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQ..."
                  value={settings.telegramBotToken}
                  onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Telegram Chat ID វត្តមានទូទៅ (General Group ID):</span>
                <input
                  type="text"
                  placeholder="-100xxxxxxxxxx ឬ ID អ្នកប្រើ"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">
                  Telegram Chat ID គណនេយ្យករ (Accounting Chat ID - សម្រាប់ពាក្យសុំច្បាប់) <span className="text-blue-500 font-bold">*</span>:
                </span>
                <input
                  type="text"
                  placeholder="ឧ. 7770204305 (គណនីគណនេយ្យករ)"
                  value={settings.telegramAccountingChatId || ""}
                  onChange={(e) => setSettings({ ...settings, telegramAccountingChatId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  💡 រាល់ពាក្យសុំច្បាប់សម្រាករបស់បុគ្គលិក នឹងត្រូវបញ្ជូនទៅកាន់ Chat ID នេះដោយស្វ័យប្រវត្តិ។
                </span>
              </div>

              {/* Telegram instructions */}
              <div className="bg-sky-50/70 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-sky-800 dark:text-sky-300">
                  <span>💡 របៀបយក Telegram Bot Token & Chat ID ងាយៗ៖</span>
                </div>
                <div>១. ចូល Telegram ស្វែងរក <b>@BotFather</b> រួចផ្ញើ <code>/newbot</code> ដើម្បីយក Token</div>
                <div>២. Add Bot នោះចូល Telegram Group របស់អ្នក ឬផ្ញើសារទៅកាន់ Bot នោះដោយផ្ទាល់</div>
                <div>៣. យក Chat ID នៃ Group ឬ User ID មកដាក់ទីនេះ (ឧទាហរណ៍ <code>7770204305</code>)</div>
              </div>

              {/* Telegram Test Button */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={testTelegramLoading || !settings.telegramBotToken || !settings.telegramChatId}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testTelegramLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>កំពុងតេស្ត...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      <span>តេស្តវត្តមាន</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setTestTelegramLoading(true);
                    setTestTelegramMsg(null);
                    try {
                      const res = await fetch("/api/telegram", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          token: settings.telegramBotToken,
                          chatId: settings.telegramAccountingChatId || settings.telegramChatId,
                          message: "🔔 <b>តេស្តប្រព័ន្ធគណនេយ្យ V2 Education ជោគជ័យ!</b>\nគណនីគណនេយ្យករត្រូវបានភ្ជាប់ដើម្បីទទួលពាក្យសុំច្បាប់បុគ្គលិកដោយរលូន។",
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setTestTelegramMsg({
                          type: "success",
                          text: "✅ តេស្តគណនីគណនេយ្យករជោគជ័យ! សារត្រូវបានផ្ញើរួចរាល់។",
                        });
                      } else {
                        setTestTelegramMsg({
                          type: "error",
                          text: `❌ ${data.error || "មិនអាចផ្ញើទៅគណនេយ្យបានទេ"}`,
                        });
                      }
                    } catch {
                      setTestTelegramMsg({
                        type: "error",
                        text: "❌ មិនអាចភ្ជាប់ទៅ Telegram API បានទេ",
                      });
                    } finally {
                      setTestTelegramLoading(false);
                    }
                  }}
                  disabled={testTelegramLoading || !settings.telegramBotToken || !settings.telegramAccountingChatId}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>តេស្តគណនេយ្យ</span>
                </button>
              </div>

              {testTelegramMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-1.5 ${
                    testTelegramMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {testTelegramMsg.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testTelegramMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {savedSuccess ? "✅ បានរក្សាទុករួចរាល់!" : "ទិន្នន័យរក្សាទុកលើ Browser"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              បោះបង់
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>រក្សាទុកការកំណត់</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
