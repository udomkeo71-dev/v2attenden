"use client";

import React, { useState, useEffect } from "react";
import { Branch, BranchId } from "@/types";
import { V2_BRANCHES, BRANCH_LIST } from "@/lib/branches";
import {
  loadBranchLocations,
  saveBranchLocations,
  loadSettings,
  saveSettings,
  AppSettings,
} from "@/lib/storage";
import { calculateDistanceMeters, MAX_GEOFENCE_RADIUS_METERS } from "@/lib/geofence";
import {
  MapPin,
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sliders,
  RotateCcw,
  Save,
  Check,
  Building,
  Radio,
  Satellite,
  Crosshair,
  Upload,
  FileCode,
  Link as LinkIcon,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface BranchLocationModalProps {
  isOpen: boolean;
  activeBranchId: BranchId;
  onClose: () => void;
  onBranchUpdated?: (updatedBranches: Record<BranchId, Branch>) => void;
  onSettingsUpdated?: (settings: AppSettings) => void;
}

export const BranchLocationModal: React.FC<BranchLocationModalProps> = ({
  isOpen,
  activeBranchId,
  onClose,
  onBranchUpdated,
  onSettingsUpdated,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId>(activeBranchId);
  const [branches, setBranches] = useState<Record<BranchId, Branch>>(loadBranchLocations());
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  // Form states for selected branch
  const currentBranch = branches[selectedBranchId] || V2_BRANCHES[selectedBranchId];
  const [latInput, setLatInput] = useState<string>(currentBranch.latitude.toString());
  const [lngInput, setLngInput] = useState<string>(currentBranch.longitude.toString());
  const [addressInput, setAddressInput] = useState<string>(currentBranch.addressKhmer);
  const [radiusInput, setRadiusInput] = useState<number>(
    Math.min(currentBranch.radiusMeters || 100, MAX_GEOFENCE_RADIUS_METERS)
  );

  // Quick coordinate / Google Maps URL paste helper
  const [quickPasteInput, setQuickPasteInput] = useState("");

  // Bulk Upload Modal state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkJsonInput, setBulkJsonInput] = useState("");

  // Live GPS states
  const [liveCoords, setLiveCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadBranchLocations();
      setBranches(loaded);
      const b = loaded[selectedBranchId] || V2_BRANCHES[selectedBranchId];
      setLatInput(b.latitude.toString());
      setLngInput(b.longitude.toString());
      setAddressInput(b.addressKhmer || "");
      setRadiusInput(Math.min(b.radiusMeters || 100, MAX_GEOFENCE_RADIUS_METERS));
      setSettings(loadSettings());
      detectCurrentLocation();
    }
  }, [isOpen, selectedBranchId]);

  if (!isOpen) return null;

  // Query device geolocation
  const detectCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError("ឧបករណ៍នេះមិនគាំទ្រ Geolocation API ទេ");
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsDetectingGps(false);
      },
      (err) => {
        console.warn("GPS detection failed:", err);
        setGpsError("មិនអាចចាប់យក GPS បានទេ (សូមពិនិត្យការអនុញ្ញាត Location)");
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Branch switcher
  const handleSelectBranch = (id: BranchId) => {
    setSelectedBranchId(id);
    const b = branches[id] || V2_BRANCHES[id];
    setLatInput(b.latitude.toString());
    setLngInput(b.longitude.toString());
    setAddressInput(b.addressKhmer || "");
    setRadiusInput(Math.min(b.radiusMeters || 100, MAX_GEOFENCE_RADIUS_METERS));
  };

  // 1-Click: Set current live GPS as branch coordinates
  const handleSetCurrentGpsAsBranch = () => {
    if (!liveCoords) {
      alert("សូមចុច 'ចាប់យកទីតាំងពេលនេះ' ជាមុនសិន");
      return;
    }

    const newLat = parseFloat(liveCoords.lat.toFixed(6));
    const newLng = parseFloat(liveCoords.lng.toFixed(6));

    setLatInput(newLat.toString());
    setLngInput(newLng.toString());

    const updated = {
      ...branches,
      [selectedBranchId]: {
        ...currentBranch,
        latitude: newLat,
        longitude: newLng,
        radiusMeters: Math.min(radiusInput, MAX_GEOFENCE_RADIUS_METERS),
      },
    };

    setBranches(updated);
    saveBranchLocations(updated);
    if (onBranchUpdated) onBranchUpdated(updated);

    setToastMessage(`✅ បានកំណត់យកទីតាំងជាក់ស្តែងជាទីតាំងសាខា ${currentBranch.nameKhmer} ជោគជ័យ!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick extract Lat & Lng from input (supports "11.5435, 104.9192" or Google Maps URL)
  const handleParseQuickInput = () => {
    if (!quickPasteInput.trim()) return;

    let lat: number | null = null;
    let lng: number | null = null;

    const text = quickPasteInput.trim();

    // Case 1: Google Maps URL query "?q=11.5435,104.9192" or "@11.5435,104.9192"
    const urlMatch = text.match(/(?:[?&]q=|@)(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      lat = parseFloat(urlMatch[1]);
      lng = parseFloat(urlMatch[2]);
    } else {
      // Case 2: Direct comma or space separated numbers
      const commaMatch = text.match(/(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)/);
      if (commaMatch) {
        lat = parseFloat(commaMatch[1]);
        lng = parseFloat(commaMatch[2]);
      }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      setLatInput(lat.toFixed(6));
      setLngInput(lng.toFixed(6));
      setToastMessage(`✅ បានស្រង់កូអរដោនេ Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} ដោយជោគជ័យ!`);
      setTimeout(() => setToastMessage(null), 3000);
      setQuickPasteInput("");
    } else {
      alert("មិនអាចសម្គាល់កូអរដោនេបានទេ។ សូមបញ្ចូលទម្រង់៖ 11.5435, 104.9192 ឬ Link Google Maps");
    }
  };

  // Save manual inputs
  const handleSaveBranch = () => {
    const parsedLat = parseFloat(latInput);
    const parsedLng = parseFloat(lngInput);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert("សូមបញ្ចូលលេខកូអរដោនេឱ្យបានត្រឹមត្រូវ");
      return;
    }

    // STRICT 100m geofence enforcement
    const finalRadius = Math.min(radiusInput || 100, MAX_GEOFENCE_RADIUS_METERS);

    const updated = {
      ...branches,
      [selectedBranchId]: {
        ...currentBranch,
        addressKhmer: addressInput.trim() || currentBranch.addressKhmer,
        latitude: parsedLat,
        longitude: parsedLng,
        radiusMeters: finalRadius,
      },
    };

    setBranches(updated);
    saveBranchLocations(updated);
    if (onBranchUpdated) onBranchUpdated(updated);

    setToastMessage(`✅ បានរក្សាទុកទីតាំងសាខា ${currentBranch.nameKhmer} (កាំកំណត់ ១០០ ម៉ែត្រ) ជោគជ័យ!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset branch to factory default
  const handleResetBranch = () => {
    const def = V2_BRANCHES[selectedBranchId];
    setLatInput(def.latitude.toString());
    setLngInput(def.longitude.toString());
    setAddressInput(def.addressKhmer);
    setRadiusInput(Math.min(def.radiusMeters || 100, MAX_GEOFENCE_RADIUS_METERS));

    const updated = {
      ...branches,
      [selectedBranchId]: def,
    };
    setBranches(updated);
    saveBranchLocations(updated);
    if (onBranchUpdated) onBranchUpdated(updated);

    setToastMessage("🔄 បានកំណត់ទៅជាកូអរដោនេដើមវិញជោគជ័យ!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Bulk JSON Upload / Import
  const handleImportBulkLocations = () => {
    try {
      const parsed = JSON.parse(bulkJsonInput);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("ទម្រង់មិនត្រឹមត្រូវ");
      }

      const merged = { ...branches, ...parsed };
      setBranches(merged);
      saveBranchLocations(merged);
      if (onBranchUpdated) onBranchUpdated(merged);
      setShowBulkUpload(false);
      setBulkJsonInput("");
      setToastMessage("✅ បាននាំចូល និងរក្សាទុកទីតាំងគ្រប់សាខាជោគជ័យ!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      alert("ទិន្នន័យ JSON មិនត្រឹមត្រូវ សូមពិនិត្យទម្រង់ម្តងទៀត");
    }
  };

  // Change GPS Simulation Mode
  const handleSimModeChange = (mode: "REAL" | "INSIDE" | "OUTSIDE") => {
    const updated = { ...settings, gpsSimMode: mode };
    setSettings(updated);
    saveSettings(updated);
    if (onSettingsUpdated) onSettingsUpdated(updated);
  };

  // Compute live distance if coordinates exist
  const effectiveLat = parseFloat(latInput) || currentBranch.latitude;
  const effectiveLng = parseFloat(lngInput) || currentBranch.longitude;
  const liveDistance = liveCoords
    ? calculateDistanceMeters(liveCoords.lat, liveCoords.lng, effectiveLat, effectiveLng)
    : null;

  const isWithinRadius = liveDistance !== null ? liveDistance <= 100 : null;
  const googleMapsUrl = `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150 font-kantumruy">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center shadow-inner">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold font-battambang leading-tight">
                កំណត់ និង Upload ទីតាំងស្កេនតាមសាខា
              </h2>
              <p className="text-[11px] text-blue-100">
                កូអរដោនេ GPS, ផែនទី និងកម្រិតសុវត្ថិភាពចម្ងាយត្រឹម ១០០ ម៉ែត្រ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-150 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Strict Geofence Alert Banner */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">គោលការណ៍តឹងរ៉ឹង៖ កម្រិតកាំស្កេនកំណត់ត្រឹម ១០០ ម៉ែត្រ (≤ 100m)</span>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300 mt-0.5">
                បុគ្គលិកត្រូវតែស្ថិតនៅក្នុងបរិវេណមិនលើសពី ១០០ ម៉ែត្រពីសាខាទើបអាចស្កេនចូល ឬចេញបាន។ ប្រសិនបើលើសពី ១០០ ម៉ែត្រ ប្រព័ន្ធនឹងទប់ស្កាត់ការស្កេនមិនឱ្យចេញជាដាច់ខាត។
              </p>
            </div>
          </div>

          {/* Ready Status Notice */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block">ទីតាំងទាំង ៧ សាខាត្រូវបានកំណត់ត្រឹមត្រូវរួចរាល់ ១០០%!</span>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300">
                លោកអ្នកអាចចុចប៊ូតុង <b>"បិទ"</b> ឬ <b>"រក្សាទុកទីតាំង"</b> ដើម្បីប្រើប្រាស់បានភ្លាមៗ ដោយមិនបាច់កែប្រែក៏បាន។
              </p>
            </div>
          </div>

          {/* 1. Branch Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-battambang">
                ជ្រើសរើសសាខាដើម្បីកំណត់ទីតាំង (Select Branch)
              </label>
              <button
                type="button"
                onClick={() => setShowBulkUpload(!showBulkUpload)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload កូអរដោនេច្រើនសាខា</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
              {BRANCH_LIST.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBranch(b.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                    selectedBranchId === b.id
                      ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm ring-1 ring-blue-500/20"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="text-xs">{b.id}</span>
                  <span className="text-[9px] font-normal truncate max-w-full opacity-80">
                    {b.nameKhmer.replace("សាខា", "")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Upload Section */}
          {showBulkUpload && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>បិទភ្ជាប់ (Paste) កូអរដោនេច្រើនសាខាជា JSON</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  បិទវិញ
                </button>
              </div>
              <textarea
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                placeholder='ឧទាហរណ៍៖ {"BKK":{"latitude":11.5435,"longitude":104.9192,"radiusMeters":100}}'
                className="w-full h-20 text-xs font-mono p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleImportBulkLocations}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
              >
                នាំចូលកូអរដោនេ (Import)
              </button>
            </div>
          )}

          {/* Active Branch Header Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                style={{ backgroundColor: currentBranch.color }}
              >
                {currentBranch.id}
              </div>
              <div>
                <div className="text-sm font-bold font-battambang text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentBranch.nameKhmer}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-sans font-bold">
                    កាំកំណត់៖ ១០០m
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  📍 {currentBranch.addressEnglish || currentBranch.addressKhmer}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="text-blue-500 font-medium">✈️ {currentBranch.contactNumber}</span>
                  <span>•</span>
                  <span className="text-indigo-500 font-medium">🌐 {currentBranch.facebookPage}</span>
                </div>
              </div>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 rounded-xl text-[11px] font-semibold transition border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-2xs shrink-0"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* 2. Fast Coordinate / Google Maps Link Parser */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-battambang">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>បំពេញលឿនតាមរយៈ Link Google Maps ឬ កូអរដោនេ</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickPasteInput}
                onChange={(e) => setQuickPasteInput(e.target.value)}
                placeholder="បិទភ្ជាប់ Link Maps ឬ 11.5435, 104.9192"
                className="flex-1 text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleParseQuickInput}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shrink-0"
              >
                ស្រង់ទីតាំង
              </button>
            </div>
          </div>

          {/* 3. Live GPS Detection Card */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-white font-battambang">
                  GPS លើឧបករណ៍ពេលនេះ (Your Live GPS)
                </span>
              </div>

              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={isDetectingGps}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isDetectingGps ? "animate-spin" : ""}`} />
                <span>ចាប់យកទីតាំង</span>
              </button>
            </div>

            {gpsError && (
              <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {liveCoords ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Latitude</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {liveCoords.lat.toFixed(6)}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Longitude</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {liveCoords.lng.toFixed(6)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    ចម្ងាយពីសាខានេះ:{" "}
                    <b className="font-sans text-slate-800 dark:text-slate-100">
                      {liveDistance !== null ? `${liveDistance} ម៉ែត្រ` : "--"}
                    </b>
                  </span>

                  {isWithinRadius !== null && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isWithinRadius
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {isWithinRadius ? "✅ ក្នុងបរិវេណ (≤100m)" : "⛔ ក្រៅបរិវេណ (>100m ស្កេនមិនចេញ)"}
                    </span>
                  )}
                </div>

                {/* 1-Click Set Current GPS Button */}
                <button
                  type="button"
                  onClick={handleSetCurrentGpsAsBranch}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold font-battambang transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>កំណត់យកទីតាំងខ្ញុំពេលនេះ ជាទីតាំងផ្លូវការរបស់សាខា</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-1">
                {isDetectingGps ? "កំពុងទាញយកទីតាំង GPS..." : "ចុច 'ចាប់យកទីតាំង' ដើម្បីផ្ទៀងផ្ទាត់"}
              </div>
            )}
          </div>

          {/* 4. Manual Branch Coordinates Form */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-battambang">
              បំពេញកូអរដោនេ & អាសយដ្ឋានសាខា (Manual Coordinates)
            </h3>

            {/* Address Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                អាសយដ្ឋានសាខា (Branch Address)
              </label>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full text-xs font-kantumruy px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="ឧ. ផ្លូវលេខ... សង្កាត់... ខណ្ឌ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Latitude (រយៈទទឹង)
                </label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="11.5475"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Longitude (រយៈបណ្តោយ)
                </label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="104.9213"
                />
              </div>
            </div>

            {/* Radius Locked at 100m */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  កាំអនុញ្ញាតស្កេនអតិបរមា (Max Allowed Radius)
                </span>
                <p className="text-[10px] text-slate-400">
                  កំណត់ស្តង់ដារ ១០០ ម៉ែត្រ (ហាមឃាត់ការស្កេនក្រៅពី ១០០ ម៉ែត្រ)
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-xs font-sans shadow-2xs">
                ១០០ m
              </span>
            </div>
          </div>

          {/* 5. GPS Test Simulation Mode Switcher */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-battambang">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>របៀបតេស្ត GPS (Testing Simulation Mode)</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSimModeChange("INSIDE")}
                className={`p-2 rounded-2xl border text-center transition ${
                  settings.gpsSimMode === "INSIDE"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">🏢 ក្នុងសាខា</div>
                <div className="text-[10px] text-slate-400 mt-0.5">~15 ម៉ែត្រ (ជាប់)</div>
              </button>

              <button
                type="button"
                onClick={() => handleSimModeChange("OUTSIDE")}
                className={`p-2 rounded-2xl border text-center transition ${
                  settings.gpsSimMode === "OUTSIDE"
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">⛔ ក្រៅសាខា</div>
                <div className="text-[10px] text-slate-400 mt-0.5">~350 ម៉ែត្រ (ស្កេនមិនចេញ)</div>
              </button>

              <button
                type="button"
                onClick={() => handleSimModeChange("REAL")}
                className={`p-2 rounded-2xl border text-center transition ${
                  settings.gpsSimMode === "REAL"
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-bold">🛰️ GPS ពិត</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ឧបករណ៍ផ្ទាល់</div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetBranch}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ទីតាំងដើម</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              បិទ
            </button>
            <button
              type="button"
              onClick={handleSaveBranch}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-battambang transition shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>រក្សាទុកទីតាំង</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
