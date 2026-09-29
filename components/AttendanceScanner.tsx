"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  AttendanceRecord,
  AttendanceType,
  Branch,
  BranchId,
  Staff,
} from "@/types";
import { V2_BRANCHES, BRANCH_LIST } from "@/lib/branches";
import { validateBranchGeofence } from "@/lib/geofence";
import { evaluatePunctuality } from "@/lib/punctuality";
import { soundEffects } from "@/lib/audio";
import { formatTelegramAttendanceMessage } from "@/lib/telegram";
import { generateAttendanceBadgeImage } from "@/lib/badge";
import { AppSettings, loadSettings } from "@/lib/storage";
import { PunctualityBadge } from "./PunctualityBadge";
import jsQR from "jsqr";
import {
  Camera,
  QrCode,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserCheck,
  SwitchCamera,
  Sliders,
  ExternalLink,
  Lock,
  ShieldAlert,
} from "lucide-react";

interface AttendanceScannerProps {
  currentBranchId: BranchId;
  onBranchChange: (id: BranchId) => void;
  staffList: Staff[];
  currentStaff?: Staff;
  isAdmin?: boolean;
  onAttendanceSubmitted: (record: AttendanceRecord, isSimulated: boolean) => void;
  onOpenSettings: () => void;
  onOpenLocationSettings?: () => void;
  branchLocations?: Record<BranchId, Branch>;
  initialAttendanceType?: AttendanceType;
  initialStaffId?: string;
}

export const AttendanceScanner: React.FC<AttendanceScannerProps> = ({
  currentBranchId,
  onBranchChange,
  staffList,
  currentStaff,
  isAdmin = true,
  onAttendanceSubmitted,
  onOpenSettings,
  onOpenLocationSettings,
  branchLocations,
  initialAttendanceType = "CHECK_IN",
  initialStaffId,
}) => {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(initialAttendanceType);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    (!isAdmin && currentStaff ? currentStaff.id : initialStaffId) || ""
  );
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  // Sync with initial props when navigated from Check-in or Check-out buttons
  useEffect(() => {
    if (initialAttendanceType) {
      setAttendanceType(initialAttendanceType);
    }
  }, [initialAttendanceType]);

  useEffect(() => {
    if (initialStaffId) {
      setSelectedStaffId(initialStaffId);
    }
  }, [initialStaffId]);

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // GPS Coordinates & Geofence
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: V2_BRANCHES[currentBranchId].latitude,
    lng: V2_BRANCHES[currentBranchId].longitude,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Submission / Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");

  // Scan Mode: QR (Default) vs FACE
  const [scanMode, setScanMode] = useState<"QR" | "FACE">("QR");
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);
  const [scannedBranch, setScannedBranch] = useState<Branch | null>(null);
  const [geofenceBlockedInfo, setGeofenceBlockedInfo] = useState<{
    branchName: string;
    distanceMeters: number;
    radiusMeters: number;
    googleMapsUrl: string;
  } | null>(null);

  const currentBranch =
    (branchLocations && branchLocations[currentBranchId]) ||
    V2_BRANCHES[currentBranchId];

  // Filter staff by current branch
  const branchStaff = staffList.filter((s) => s.branchId === currentBranchId);
  const selectedStaff =
    staffList.find((s) => s.id === selectedStaffId) || branchStaff[0] || staffList[0];

  // Auto-select staff on branch change if previous selection not in this branch
  useEffect(() => {
    if (branchStaff.length > 0 && (!selectedStaffId || !branchStaff.some((s) => s.id === selectedStaffId))) {
      setSelectedStaffId(branchStaff[0].id);
    }
  }, [currentBranchId, branchStaff, selectedStaffId]);

  // Load and refresh GPS coordinates based on settings
  const refreshLocation = React.useCallback(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);

    if (loadedSettings.gpsSimMode === "OUTSIDE") {
      // Simulate location ~350m outside branch radius for admin testing
      setUserCoords({
        lat: currentBranch.latitude + 0.003,
        lng: currentBranch.longitude + 0.003,
      });
      setGpsError(null);
    } else {
      // REAL DEVICE GPS (Strict Standard - No Fake Simulation)
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            setGpsLoading(false);
            setGpsError(null);
          },
          (err) => {
            console.warn("GPS error:", err.message);
            setGpsError("មិនអាចទាញយក GPS បានទេ! សូមបើក Location លើទូរស័ព្ទរបស់អ្នក");
            setGpsLoading(false);
            // ⛔ STRICT: Never fall back to branch coords!
            setUserCoords({
              lat: 0,
              lng: 0,
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setGpsError("ឧបករណ៍នេះមិនគាំទ្រ GPS ឡើយ");
        setUserCoords({ lat: 0, lng: 0 });
      }
    }
  }, [currentBranch]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  // Start / Stop Camera
  const startCamera = React.useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;

    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn("Camera access error:", err);
      setCameraError("មិនអាចបើកកាមេរ៉ាបានទេ (សូមអនុញ្ញាត Camera Permission)");
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Cooldown ref to prevent repeated beeping for same QR
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time QR Code detector
  const handleQRCodeDetected = React.useCallback(
    (rawText: string) => {
      const now = Date.now();
      if (
        lastScannedRef.current &&
        lastScannedRef.current.text === rawText &&
        now - lastScannedRef.current.time < 3000
      ) {
        return; // cooldown active for same QR
      }
      lastScannedRef.current = { text: rawText, time: now };

      // Check if QR matches branch
      for (const branch of BRANCH_LIST) {
        if (
          rawText.includes(`branch=${branch.id}`) ||
          rawText.includes(`branchId":"${branch.id}"`) ||
          rawText.includes(`branchId=${branch.id}`) ||
          rawText.includes(branch.nameKhmer) ||
          rawText.trim().toUpperCase() === branch.id
        ) {
          if (currentBranchId !== branch.id) {
            onBranchChange(branch.id);
          }
          setScannedBranch(branch);
          soundEffects.playSuccess();
          setScannedAlert(`✅ បានស្កេនជាប់: សាខា ${branch.nameKhmer} (${branch.id})`);
          setTimeout(() => setScannedAlert(null), 5000);
          return;
        }
      }

      // Check if QR matches staff
      for (const s of staffList) {
        if (
          rawText.includes(s.id) ||
          (s.phone && rawText.includes(s.phone)) ||
          rawText.includes(s.name)
        ) {
          setSelectedStaffId(s.id);
          if (s.branchId !== currentBranchId) {
            onBranchChange(s.branchId);
          }
          soundEffects.playSuccess();
          setScannedAlert(`✅ បានស្កេនបុគ្គលិក: ${s.name} (${s.role})`);
          setTimeout(() => setScannedAlert(null), 4000);
          return;
        }
      }
    },
    [currentBranchId, onBranchChange, staffList]
  );

  useEffect(() => {
    if (scanMode !== "QR" || !cameraActive || !videoRef.current) return;

    let detector: unknown = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const BD = (window as unknown as { BarcodeDetector: new (opt: { formats: string[] }) => { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        detector = new BD({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || isProcessing || video.readyState < 2) return;

      // 1. Try native BarcodeDetector if supported
      if (detector) {
        try {
          const d = detector as { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
          const barcodes = await d.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleQRCodeDetected(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fall through to jsQR
        }
      }

      // 2. Universal jsQR fallback (supports iPhone Safari, iPad, and all browsers)
      try {
        let canvas = qrCanvasRef.current;
        if (!canvas) {
          canvas = document.createElement("canvas");
          qrCanvasRef.current = canvas;
        }
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        if (w > 0 && h > 0) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              handleQRCodeDetected(code.data);
            }
          }
        }
      } catch {
        // Frame skipped
      }
    }, 280);

    return () => clearInterval(interval);
  }, [scanMode, cameraActive, isProcessing, handleQRCodeDetected]);

  // Evaluate live Geofence
  const geofenceResult = validateBranchGeofence(
    userCoords.lat,
    userCoords.lng,
    currentBranch
  );

  // Evaluate live punctuality
  const livePunctuality = selectedStaff
    ? evaluatePunctuality(attendanceType, new Date(), selectedStaff)
    : {
        status: "ON_TIME" as const,
        labelKhmer: "🔵 ទាន់ម៉ោង",
        diffMinutes: 0,
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
        detailKhmer: "ម៉ោងកំណត់ធម្មតា",
      };

  // Capture photo snapshot
  const captureSnapshot = (): string => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // If front camera, flip horizontally for natural mirror look
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.85);
      }
    }

    // Fallback high-resolution attendance badge if camera is disabled/not accessible
    const now = new Date();
    return generateAttendanceBadgeImage({
      type: attendanceType,
      staffName: selectedStaff?.name || "បុគ្គលិក",
      staffRole: selectedStaff?.role || "បុគ្គលិកទូទៅ",
      branchName: currentBranch.nameKhmer,
      branchId: currentBranch.id,
      formattedTime: now.toLocaleTimeString("en-GB"),
      formattedDate: now.toLocaleDateString("en-GB"),
      punctualityLabel: livePunctuality.labelKhmer,
      geofenceStatus: geofenceResult.statusLabelKhmer,
      distanceMeters: geofenceResult.distanceMeters,
    });
  };

  // Handle Scan & Verification Submission
  const handleVerifyAndSubmit = async (
    overrideType?: AttendanceType,
    targetBranch?: Branch
  ) => {
    if (!selectedStaff) {
      alert("សូមជ្រើសរើសបុគ្គលិកជាមុនសិន");
      return;
    }

    const finalType = overrideType || attendanceType;
    if (overrideType && overrideType !== attendanceType) {
      setAttendanceType(overrideType);
    }

    // Strict branch resolution: staff MUST be at their assigned branch
    const staffBranch = V2_BRANCHES[selectedStaff.branchId] || currentBranch;
    const activeBranch = targetBranch || staffBranch;

    // ⛔ STRICT GPS REQUIREMENT: Must have real device GPS coordinates
    if (!userCoords || (userCoords.lat === 0 && userCoords.lng === 0)) {
      soundEffects.playError();
      alert(
        "⛔ មិនអាចកត់ត្រាវត្តមានបានទេ — ខ្វះទីតាំង GPS!\n\n" +
        "ប្រព័ន្ធមិនទាន់ទទួលបានទីតាំង GPS ពិតប្រាកដលើទូរស័ព្ទរបស់អ្នកឡើយ។\n" +
        "សូមបើកមុខងារ GPS (Location) លើទូរស័ព្ទរបស់អ្នក និងចុច 'Allow' (អនុញ្ញាត) ឱ្យកម្មវិធីប្រើប្រាស់ទីតាំង។"
      );
      return;
    }

    // =========================================================
    // ⛔ STRICT GEOFENCE ENFORCEMENT: លើសពី ១០០m មិនអាចស្កេនបានទេ
    // =========================================================
    const activeGeofence = validateBranchGeofence(
      userCoords.lat,
      userCoords.lng,
      activeBranch
    );

    if (!activeGeofence.isWithinGeofence || activeGeofence.distanceMeters > 100) {
      soundEffects.playError();
      setGeofenceBlockedInfo({
        branchName: activeBranch.nameKhmer,
        distanceMeters: activeGeofence.distanceMeters,
        radiusMeters: activeBranch.radiusMeters || 100,
        googleMapsUrl: activeGeofence.googleMapsUrl,
      });
      return; // ⛔ STRICTLY BLOCK SCANNING!
    }

    setIsProcessing(true);
    setProcessingStatus("កំពុងផ្តិតយករូបភាព និងតម្រង់ផ្ទៃមុខ...");

    try {
      // 1. Capture snapshot
      const photoBase64 = captureSnapshot();

      // 2. Call Google Gemini AI verification endpoint
      setProcessingStatus("Google Gemini AI កំពុងផ្ទៀងផ្ទាត់ផ្ទៃមុខ និង Anti-Spoofing...");
      const aiRes = await fetch("/api/verify-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoBase64,
          staffName: selectedStaff.name,
          branchName: activeBranch.nameKhmer,
          apiKey: settings.geminiApiKey,
        }),
      });

      const aiData = await aiRes.json();
      const aiVerification = {
        isValid: aiData.isValid ?? true,
        isRealPerson: aiData.isRealPerson ?? true,
        summaryKhmer:
          aiData.summaryKhmer ||
          "បានផ្ទៀងផ្ទាត់ផ្ទៃមុខមនុស្សពិត និងគ្មានសញ្ញាក្លែងបន្លំឡើយ។",
      };

      // 3. Build Attendance Record
      const now = new Date();
      const activePunctuality = evaluatePunctuality(finalType, now, selectedStaff);

      const record: AttendanceRecord = {
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
        type: finalType,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        staffRole: selectedStaff.role,
        branchId: activeBranch.id,
        branchName: activeBranch.nameKhmer,
        userCoords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
        geofence: activeGeofence,
        punctuality: activePunctuality,
        aiVerification,
        photoBase64,
        telegramNotified: true,
      };

      // 4. Send Telegram Group Alert (Standard CheckinMeBot 3-line format)
      setProcessingStatus("កំពុងបញ្ជូនដំណឹងទៅកាន់ Telegram Group...");
      const telegramMessage = formatTelegramAttendanceMessage(
        record,
        selectedStaff.subject || selectedStaff.department
      );

      const telegramRes = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          message: telegramMessage,
          photoBase64: photoBase64,
          sendAsText: true, // 🔒 Strict CheckinMeBot text format from user screenshot
        }),
      });

      const telegramData = await telegramRes.json();
      const isSimulated = Boolean(telegramData.isSimulated || aiData.isSimulated);

      // 5. Sound & Visual celebration
      if (activePunctuality.status === "ON_TIME" || activePunctuality.status === "EARLY") {
        soundEffects.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b"],
        });
      } else {
        soundEffects.playWarning();
      }

      // 6. Callback to update parent state & show modal
      onAttendanceSubmitted(record, isSimulated);
    } catch (err: unknown) {
      console.error("Attendance submission error:", err);
      alert("មានបញ្ហាក្នុងការកត់ត្រាវត្តមាន សូមព្យាយាមម្តងទៀត");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-kantumruy">
      {/* Hidden Canvas for snapshot extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Left Column: Live Camera & Face Guide Oval (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col">
          {/* Header of Camera Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-bold shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm font-battambang text-slate-800 dark:text-white">
                    កាមេរ៉ាស្កេនកូដ QR សាខា (Branch QR Attendance)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {currentBranch.nameKhmer}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  តម្រង់កាមេរ៉ាទៅលើ QR Code សាខា {currentBranch.nameKhmer} ({currentBranch.id}) ដើម្បីកត់ត្រាវត្តមាន
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ស្កេនកូដ QR សាខា</span>
              </div>

              <button
                onClick={toggleCameraFacing}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition"
                title="ប្តូរកាមេរ៉ាមុខ/ក្រោយ"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Camera View Container with QR Target */}
          <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />

            {/* If Camera Error / Inactive */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/90 z-20">
                <Camera className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
                <p className="text-xs font-medium text-slate-300">
                  {cameraError || "កំពុងភ្ជាប់ទៅកាន់កាមេរ៉ា..."}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition"
                >
                  បើកកាមេរ៉ាឡើងវិញ
                </button>
              </div>
            )}

            {/* Viewfinder Overlays */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                {/* Square QR Code Viewfinder with glowing corner brackets & laser */}
                <div className="w-[210px] h-[210px] sm:w-[250px] sm:h-[250px] border border-emerald-500/30 rounded-3xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* 4 Glowing Corner Brackets */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_8px_#10b981]" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_8px_#10b981]" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_8px_#10b981]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_8px_#10b981]" />

                  {/* Animated Scanning Laser Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-laser" />

                  {/* Center crosshair */}
                  <div className="w-6 h-6 border border-emerald-400/40 rounded-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </div>

                  <div className="absolute -bottom-8 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30 whitespace-nowrap shadow-md">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>តម្រង់កូដ QR សាខា {currentBranch.nameKhmer} ក្នុងប្រអប់នេះ</span>
                  </div>
                </div>

                {/* Scanned Alert Toast */}
                {scannedAlert && (
                  <div className="absolute top-4 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{scannedAlert}</span>
                  </div>
                )}
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-in fade-in duration-150">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <div className="font-bold text-sm font-battambang text-blue-400">
                  កំពុងផ្ទៀងផ្ទាត់...
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">{processingStatus}</p>
              </div>
            )}
          </div>

          {/* Permanent Confirmed Branch Indicator Card */}
          <div className="mt-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  🏫
                </div>
                <div>
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    បញ្ជាក់សាខាស្កេនវត្តមាន (Confirmed Branch)
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white font-battambang flex items-center gap-1.5">
                    <span>{currentBranch.nameKhmer}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold">
                      {currentBranch.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>QR សាខាផ្លូវការ</span>
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span>📍 កូដស្លាក QR ៖ <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">V2-STAND-{currentBranch.id}</code></span>
              <span>កាំកំណត់៖ <b>≤ {currentBranch.radiusMeters || 100}m</b></span>
            </div>
          </div>

          {/* Quick Action Card when Branch QR is scanned */}
          {scannedBranch && (
            <div className="mt-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border-2 border-emerald-500 dark:border-emerald-400 p-4 rounded-2xl shadow-lg animate-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    🏢
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-battambang flex items-center gap-1.5">
                      <span>បានស្កេនកូដ QR សាខា៖</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{scannedBranch.nameKhmer}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      បុគ្គលិក: <b className="text-blue-600 dark:text-blue-400">{selectedStaff?.name}</b> ({selectedStaff?.role})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScannedBranch(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-sm font-bold"
                  title="បិទ"
                >
                  ✕
                </button>
              </div>

              {/* Instant 1-tap Check-In / Check-Out buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyAndSubmit("CHECK_IN", scannedBranch);
                    setScannedBranch(null);
                  }}
                  disabled={isProcessing}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold font-battambang transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>🟢 កត់ត្រាចូល (Check-In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyAndSubmit("CHECK_OUT", scannedBranch);
                    setScannedBranch(null);
                  }}
                  disabled={isProcessing}
                  className="py-3 px-3 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-bold font-battambang transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>🟠 កត់ត្រាចេញ (Check-Out)</span>
                </button>
              </div>
              <div className="text-[10px] text-center text-emerald-800 dark:text-emerald-300 font-medium">
                ⚡ បានផ្ទៀងផ្ទាត់ QR សាខា! ចុចចូល ឬចេញ ដើម្បីកត់ត្រាវត្តមាន & ផ្ញើទៅ Telegram bot ភ្លាមៗ
              </div>
            </div>
          )}

          {/* Quick Branch QR Scanner Simulation Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span className="text-slate-500">ស្កេនជាប់សាខា:</span>
              <span className="font-bold text-slate-800 dark:text-white font-battambang">
                {currentBranch.nameKhmer}
              </span>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400">ប្តូរសាខា:</span>
              <select
                value={currentBranchId}
                onChange={(e) => onBranchChange(e.target.value as BranchId)}
                className="text-xs font-semibold px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
              >
                {BRANCH_LIST.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameKhmer} ({b.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Attendance Verification Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          {/* Check-In / Check-Out Toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              ប្រភេទវត្តមាន (Attendance Action)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAttendanceType("CHECK_IN")}
                className={`py-2 rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
                  attendanceType === "CHECK_IN"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                <span>🟢 ចូលធ្វើការ (Check-In)</span>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType("CHECK_OUT")}
                className={`py-2 rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
                  attendanceType === "CHECK_OUT"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                <span>🟠 ចេញពីការងារ (Check-Out)</span>
              </button>
            </div>
          </div>

          {/* Staff Selector */}
          {/* Staff Selector (Admin) vs Staff Identity Card (Staff) */}
          <div>
            {isAdmin ? (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ជ្រើសរើសបុគ្គលិក (Staff Member)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {branchStaff.length} នាក់ក្នុងសាខានេះ
                  </span>
                </div>
                <select
                  value={selectedStaff?.id || ""}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.role} ({V2_BRANCHES[s.branchId]?.nameKhmer || s.branchId}) [កូដ: {s.code || s.id}]
                    </option>
                  ))}
                </select>

                {selectedStaff && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{selectedStaff.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      វេន: {selectedStaff.checkInTime} - {selectedStaff.checkOutTime}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  កត់ត្រាវត្តមានសម្រាប់សាមីខ្លួន (Staff Identity)
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white font-battambang">
                        {selectedStaff?.name} ({selectedStaff?.role})
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        វេនការងារ: {selectedStaff?.checkInTime} - {selectedStaff?.checkOutTime} ({selectedStaff?.shiftHours || 8} ម៉ោង/ថ្ងៃ)
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                    {selectedStaff?.code || selectedStaff?.id}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* GPS Geofence Status Card - STRICT 100M ENFORCEMENT */}
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
              geofenceResult.isWithinGeofence
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
                : "bg-rose-50/80 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5">
                {geofenceResult.isWithinGeofence ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  GPS Geofencing: {geofenceResult.isWithinGeofence ? "ក្នុងបរិវេណ (≤ ១០០m)" : "⛔ ក្រៅបរិវេណ (> ១០០m)"}
                </span>
              </div>
              <button
                type="button"
                onClick={refreshLocation}
                disabled={gpsLoading}
                className="p-1 hover:bg-black/10 rounded-lg transition"
                title="Refresh GPS"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="text-[11px] opacity-90 flex items-center justify-between">
              <span>
                ចម្ងាយពីសាខា: <b>{geofenceResult.distanceMeters} ម៉ែត្រ</b> (កាំកំណត់{" "}
                {currentBranch.radiusMeters || 100}m)
              </span>
              <a
                href={geofenceResult.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {geofenceResult.isWithinGeofence ? (
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                <span>✅ ទីតាំងត្រឹមត្រូវក្នុងកាំ ១០០m — អាចស្កេនចូល ឬចេញបាន</span>
              </div>
            ) : (
              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 pt-1 border-t border-rose-200/60 dark:border-rose-800/60 flex items-start gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  ⛔ <b>មិនអាចស្កេនបានទេ!</b> លោកអ្នកស្ថិតនៅចម្ងាយលើសពី ១០០ ម៉ែត្រពីសាខា {currentBranch.nameKhmer}។
                </span>
              </div>
            )}
          </div>

          {/* Punctuality Status Badge Preview */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">ស្ថានភាពម៉ោងពេលនេះ:</span>
              <PunctualityBadge punctuality={livePunctuality} />
            </div>
            <div className="text-[11px] text-slate-500">{livePunctuality.detailKhmer}</div>
          </div>

          {/* Submit Attendance Button - STRICT GEOFENCE BLOCKAGE */}
          {!geofenceResult.isWithinGeofence ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.playError();
                setGeofenceBlockedInfo({
                  branchName: currentBranch.nameKhmer,
                  distanceMeters: geofenceResult.distanceMeters,
                  radiusMeters: currentBranch.radiusMeters || 100,
                  googleMapsUrl: geofenceResult.googleMapsUrl,
                });
              }}
              className="w-full py-4 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 dark:hover:bg-rose-900/70 border-2 border-rose-400 dark:border-rose-700 text-rose-800 dark:text-rose-200 rounded-2xl font-bold font-battambang text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Lock className="w-5 h-5 text-rose-600 shrink-0" />
              <span>⛔ ក្រៅបរិវេណ &gt; ១០០m (ប្រព័ន្ធចាក់សោរមិនឱ្យស្កេន)</span>
            </button>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleVerifyAndSubmit("CHECK_IN")}
                disabled={isProcessing || !selectedStaff}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-bold font-battambang text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing && attendanceType === "CHECK_IN" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងកត់ត្រាចូល...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>🟢 ចុចស្កេនចូល (Check-In) នៅ {currentBranch.nameKhmer}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleVerifyAndSubmit("CHECK_OUT")}
                disabled={isProcessing || !selectedStaff}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white rounded-2xl font-bold font-battambang text-sm shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing && attendanceType === "CHECK_OUT" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងកត់ត្រាចេញ...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>🟠 ចុចស្កេនចេញ (Check-Out) នៅ {currentBranch.nameKhmer}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Settings Shortcut Note (Admin Only) */}
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-center pt-1">
              {onOpenLocationSettings && (
                <button
                  type="button"
                  onClick={onOpenLocationSettings}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline transition inline-flex items-center gap-1 font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>កំណត់ទីតាំង GPS សាខា</span>
                </button>
              )}
              <button
                onClick={onOpenSettings}
                className="text-[11px] text-slate-400 hover:text-blue-600 transition inline-flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>
                  របៀបតេស្ត GPS: <b>{settings.gpsSimMode}</b>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ⛔ GEOFENCE BLOCKED POPUP MODAL (STRICT 100M ENFORCEMENT) */}
      {/* ========================================================= */}
      {geofenceBlockedInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-rose-400 dark:border-rose-800 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>

            <div>
              <h3 className="font-bold text-base sm:text-lg font-battambang text-rose-600">
                ⛔ មិនអាចស្កេនវត្តមានបានទេ!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ក្រៅបរិវេណទីតាំងកំណត់ (Geofence Blocked)
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-xs text-left space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>សាខាគោលដៅ៖</span>
                <span className="font-bold text-slate-900 dark:text-white">{geofenceBlockedInfo.branchName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>ចម្ងាយបច្ចុប្បន្នរបស់អ្នក៖</span>
                <span className="font-bold text-rose-600 font-mono text-sm">{geofenceBlockedInfo.distanceMeters} ម៉ែត្រ</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>កាំអនុញ្ញាតអតិបរមា៖</span>
                <span className="font-bold text-emerald-600 font-mono">ត្រឹមតែ ១០០ ម៉ែត្រ</span>
              </div>
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                📌 <b>លក្ខខណ្ឌកំណត់៖</b> រាល់ការស្កេនចេញ ឬស្កេនចូល ត្រូវតែស្ថិតក្នុងបរិវេណកន្លែងស្កេន (មិនលើសពី ១០០m)។ សូមចូលទៅក្នុងបរិវេណសាខា ដើម្បីស្កេនវត្តមាន។
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setGeofenceBlockedInfo(null);
                  refreshLocation();
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>🔄 ពិនិត្យទីតាំង GPS ម្តងទៀត</span>
              </button>

              <a
                href={geofenceBlockedInfo.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>🗺️ មើលទីតាំងជាក់ស្តែងលើ Google Maps</span>
              </a>

              <button
                type="button"
                onClick={() => setGeofenceBlockedInfo(null)}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                បិទផ្ទាំងនេះ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
