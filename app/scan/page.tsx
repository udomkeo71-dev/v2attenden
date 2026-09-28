"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  AttendanceRecord,
  AttendanceType,
  BranchId,
  Staff,
} from "@/types";
import { V2_BRANCHES, BRANCH_LIST } from "@/lib/branches";
import { validateBranchGeofence } from "@/lib/geofence";
import { evaluatePunctuality } from "@/lib/punctuality";
import { soundEffects } from "@/lib/audio";
import { formatTelegramAttendanceMessage } from "@/lib/telegram";
import { generateAttendanceBadgeImage } from "@/lib/badge";
import { loadStaffList, loadSettings, INITIAL_STAFF } from "@/lib/storage";
import { PunctualityBadge } from "@/components/PunctualityBadge";
import { InstallAppModal } from "@/components/InstallAppModal";
import Link from "next/link";
import jsQR from "jsqr";
import {
  Camera,
  QrCode,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserCheck,
  SwitchCamera,
  Send,
  Building,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Download,
  Home,
  Lock,
  ShieldAlert,
} from "lucide-react";

function StaffScannerContent() {
  const searchParams = useSearchParams();
  const branchParam = searchParams.get("branch") as BranchId | null;

  const [currentBranchId, setCurrentBranchId] = useState<BranchId>(
    branchParam && V2_BRANCHES[branchParam] ? branchParam : "BKK"
  );
  const [attendanceType, setAttendanceType] = useState<AttendanceType>("CHECK_IN");
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [geofenceBlockedInfo, setGeofenceBlockedInfo] = useState<{
    branchName: string;
    distanceMeters: number;
    radiusMeters: number;
    googleMapsUrl: string;
  } | null>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Scan Mode: QR (Default) vs FACE
  const [scanMode, setScanMode] = useState<"QR" | "FACE">("QR");
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);

  // GPS Coordinates & Geofence
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: V2_BRANCHES[currentBranchId].latitude,
    lng: V2_BRANCHES[currentBranchId].longitude,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isUsingRealGps, setIsUsingRealGps] = useState(false);

  // Processing & Submission states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [submittedRecord, setSubmittedRecord] = useState<AttendanceRecord | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const currentBranch = V2_BRANCHES[currentBranchId];

  // Load staff on mount
  useEffect(() => {
    const list = loadStaffList();
    setStaffList(list);
  }, []);

  // Update branch if query param changes
  useEffect(() => {
    if (branchParam && V2_BRANCHES[branchParam]) {
      setCurrentBranchId(branchParam);
    }
  }, [branchParam]);

  // Filter staff by current branch
  const branchStaff = staffList.filter((s) => s.branchId === currentBranchId);
  const selectedStaff =
    staffList.find((s) => s.id === selectedStaffId) || branchStaff[0] || staffList[0];

  useEffect(() => {
    if (branchStaff.length > 0 && (!selectedStaffId || !branchStaff.some((s) => s.id === selectedStaffId))) {
      setSelectedStaffId(branchStaff[0].id);
    }
  }, [currentBranchId, branchStaff, selectedStaffId]);

  // Fetch device GPS coordinates
  const refreshGpsLocation = React.useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsUsingRealGps(true);
          setGpsLoading(false);
        },
        (err) => {
          console.warn("GPS error:", err.message);
          setGpsLoading(false);
          // Fallback to branch coords
          setUserCoords({
            lat: currentBranch.latitude,
            lng: currentBranch.longitude,
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, [currentBranch]);

  useEffect(() => {
    refreshGpsLocation();
  }, [refreshGpsLocation]);

  // Start Camera
  const startCamera = React.useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;

    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
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
    } catch (err) {
      console.warn("Camera access denied:", err);
      setCameraError("សូមអនុញ្ញាតបើក Camera លើទូរស័ព្ទរបស់អ្នក");
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Real-time QR Code detector
  const handleQRCodeDetected = React.useCallback(
    (rawText: string) => {
      const now = Date.now();
      if (
        lastScannedRef.current &&
        lastScannedRef.current.text === rawText &&
        now - lastScannedRef.current.time < 3000
      ) {
        return; // Cooldown active for same QR
      }
      lastScannedRef.current = { text: rawText, time: now };

      // Check if QR matches branch
      for (const branch of BRANCH_LIST) {
        if (
          rawText.includes(`branch=${branch.id}`) ||
          rawText.includes(`branchId":"${branch.id}"`) ||
          rawText.includes(branch.id) ||
          rawText.includes(branch.nameKhmer)
        ) {
          if (currentBranchId !== branch.id) {
            setCurrentBranchId(branch.id);
          }
          soundEffects.playSuccess();
          setScannedAlert(`✅ បានស្កេនជាប់: សាខា ${branch.nameKhmer} (${branch.id})`);
          setTimeout(() => setScannedAlert(null), 4000);
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
            setCurrentBranchId(s.branchId);
          }
          soundEffects.playSuccess();
          setScannedAlert(`✅ បានស្កេនបុគ្គលិក: ${s.name} (${s.role})`);
          setTimeout(() => setScannedAlert(null), 4000);
          return;
        }
      }
    },
    [currentBranchId, staffList]
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

      // 1. Native BarcodeDetector
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

      // 2. Universal jsQR fallback (iPhone Safari, Android, all browsers)
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

  // Evaluate Geofence
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

  // Capture snapshot
  const captureSnapshot = (): string => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.85);
      }
    }

    // Fallback high-resolution attendance badge if camera is disabled
    const now = new Date();
    const livePunctuality = selectedStaff
      ? evaluatePunctuality(attendanceType, now, selectedStaff)
      : {
          status: "ON_TIME" as const,
          labelKhmer: "🔵 ទាន់ម៉ោង",
          diffMinutes: 0,
          badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
          detailKhmer: "ម៉ោងកំណត់ធម្មតា",
        };
    const geofenceResult = validateBranchGeofence(userCoords.lat, userCoords.lng, currentBranch);

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

  // Handle Attendance Submission
  const handleScanSubmit = async (overrideType?: AttendanceType) => {
    if (!selectedStaff) {
      alert("សូមជ្រើសរើសឈ្មោះរបស់អ្នកជាមុនសិន");
      return;
    }

    const finalType = overrideType || attendanceType;
    if (overrideType && overrideType !== attendanceType) {
      setAttendanceType(overrideType);
    }

    // =========================================================
    // ⛔ STRICT GEOFENCE ENFORCEMENT: លើសពី ១០០m មិនអាចស្កេនបានទេ
    // =========================================================
    const currentGeofence = validateBranchGeofence(userCoords.lat, userCoords.lng, currentBranch);
    if (!currentGeofence.isWithinGeofence || currentGeofence.distanceMeters > 100) {
      soundEffects.playError();
      setGeofenceBlockedInfo({
        branchName: currentBranch.nameKhmer,
        distanceMeters: currentGeofence.distanceMeters,
        radiusMeters: currentBranch.radiusMeters || 100,
        googleMapsUrl: currentGeofence.googleMapsUrl,
      });
      return; // ⛔ STRICTLY BLOCK SCANNING!
    }

    setIsProcessing(true);
    setProcessingStatus("កំពុងផ្តិតយករូបភាព និងផ្ទៀងផ្ទាត់ QR...");

    try {
      const photoBase64 = captureSnapshot();

      // Gemini AI verification
      setProcessingStatus("AI កំពុងផ្ទៀងផ្ទាត់វត្តមាន...");
      const settings = loadSettings();
      const aiRes = await fetch("/api/verify-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoBase64,
          staffName: selectedStaff.name,
          branchName: currentBranch.nameKhmer,
          apiKey: settings.geminiApiKey,
        }),
      });

      const aiData = await aiRes.json();
      const aiVerification = {
        isValid: aiData.isValid ?? true,
        isRealPerson: aiData.isRealPerson ?? true,
        summaryKhmer:
          aiData.summaryKhmer ||
          "បានផ្ទៀងផ្ទាត់ផ្ទៃមុខមនុស្សពិតត្រឹមត្រូវដោយជោគជ័យ។",
      };

      // Build record
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
        branchId: currentBranch.id,
        branchName: currentBranch.nameKhmer,
        userCoords: {
          latitude: userCoords.lat,
          longitude: userCoords.lng,
        },
        geofence: currentGeofence,
        punctuality: activePunctuality,
        aiVerification,
        photoBase64,
        telegramNotified: true,
      };

      // Send to Telegram Group
      setProcessingStatus("កំពុងបញ្ជូនទិន្នន័យចូល Telegram...");
      const telegramMessage = formatTelegramAttendanceMessage(record);

      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          message: telegramMessage,
          photoBase64: photoBase64,
        }),
      });

      // Sound and confetti
      if (livePunctuality.status === "ON_TIME" || livePunctuality.status === "EARLY") {
        soundEffects.playSuccess();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b"],
        });
      } else {
        soundEffects.playWarning();
      }

      setSubmittedRecord(record);
    } catch (err) {
      console.error("Staff attendance error:", err);
      alert("មានបញ្ហាក្នុងការកត់ត្រាវត្តមាន សូមព្យាយាមម្តងទៀត");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-kantumruy flex flex-col items-center justify-start p-4 sm:p-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header for Staff */}
      <header className="w-full max-w-md flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
            <Image
              src="/v2_n.png"
              alt="V2 Education"
              width={32}
              height={32}
              className="h-7 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm font-battambang text-white">
              V2aAttendence
            </h1>
            <p className="text-[11px] text-slate-400">ប្រព័ន្ធកត់ត្រាវត្តមានបុគ្គលិក</p>
          </div>
        </div>

        {/* Actions & Current Branch Badge */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-xs font-semibold flex items-center gap-1 transition shadow-xs"
            title="ទៅកាន់ទំព័រដើម (Home Dashboard)"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-1 transition shadow-xs"
            title="ដំឡើង App លើទូរស័ព្ទដៃ"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>ដំឡើង</span>
          </button>

          <div className="px-2.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300 text-xs font-semibold flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentBranch.nameKhmer}</span>
          </div>
        </div>
      </header>

      {/* Main Staff Attendance Box */}
      <div className="w-full max-w-md mt-4 space-y-4">
        {/* Success Modal Screen if already submitted */}
        {submittedRecord ? (
          <div className="bg-slate-800/90 border border-emerald-500/50 rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-battambang text-white">
                កត់ត្រាវត្តមានជោគជ័យ!
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                ព័ត៌មានវត្តមាន និងរូបថតត្រូវបានបញ្ជូនទៅ Telegram រួចរាល់។
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">ឈ្មោះបុគ្គលិក:</span>
                <span className="font-bold text-white">{submittedRecord.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">សាខា:</span>
                <span className="text-blue-300">{submittedRecord.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ម៉ោងកត់ត្រា:</span>
                <span className="font-mono text-white">{submittedRecord.formattedTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ស្ថានភាពម៉ោង:</span>
                <PunctualityBadge punctuality={submittedRecord.punctuality} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">GPS Geofence:</span>
                <span className="text-emerald-400 font-semibold">
                  {submittedRecord.geofence.statusLabelKhmer} ({submittedRecord.geofence.distanceMeters}m)
                </span>
              </div>
            </div>

            <button
              onClick={() => setSubmittedRecord(null)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold font-battambang text-xs transition"
            >
              កត់ត្រាម្តងទៀត (Scan Again)
            </button>
          </div>
        ) : (
          <>
            {/* Top Bar for Camera Controls */}
            <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  {scanMode === "QR" ? <QrCode className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-battambang text-white">
                    ស្កេនកូដ QR សាខា
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/40 text-blue-300 font-mono font-semibold">
                    {currentBranch.nameKhmer}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>QR វត្តមាន</span>
                </div>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                  title="ប្តូរកាមេរ៉ាមុខ/ក្រោយ"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Camera View with Square QR or Face Oval */}
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "-scale-x-100" : ""
                }`}
              />

              {/* Camera inactive notice */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/90 z-20">
                  <Camera className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-300 font-medium">
                    {cameraError || "កំពុងភ្ជាប់ទៅកាន់កាមេរ៉ា..."}
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition"
                  >
                    បើកកាមេរ៉ា
                  </button>
                </div>
              )}

              {/* Viewfinder Overlays */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  {/* High-tech Square QR Code Viewfinder */}
                  <div className="w-[210px] h-[210px] border border-emerald-500/30 rounded-3xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                    {/* 4 Glowing Corner Brackets */}
                    <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_8px_#10b981]" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_8px_#10b981]" />
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_8px_#10b981]" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_8px_#10b981]" />

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-laser" />

                    {/* Center Crosshair */}
                    <div className="w-6 h-6 border border-emerald-400/40 rounded-lg flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    </div>

                    <div className="absolute -bottom-8 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30 whitespace-nowrap shadow-md">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>តម្រង់កូដ QR សាខា {currentBranch.nameKhmer} ក្នុងប្រអប់នេះ</span>
                    </div>
                  </div>

                  {/* Scanned Alert Toast */}
                  {scannedAlert && (
                    <div className="absolute top-3 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 animate-in slide-in-from-top-2 border border-emerald-400/40">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{scannedAlert}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Switch camera button */}
              <button
                onClick={toggleCameraFacing}
                className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-md p-2 rounded-xl text-white hover:bg-black/80 transition"
                title="ប្តូរកាមេរ៉ា"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-30">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                  <div className="font-bold text-sm font-battambang text-blue-400">
                    កំពុងដំណើរការ...
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{processingStatus}</p>
                </div>
              )}
            </div>

            {/* Permanent Confirmed Branch Indicator */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    🏫
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      បញ្ជាក់សាខាស្កេនវត្តមាន (Confirmed Branch)
                    </div>
                    <div className="text-sm font-extrabold text-white font-battambang flex items-center gap-1.5">
                      <span>{currentBranch.nameKhmer}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                        {currentBranch.id}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>QR សាខាផ្លូវការ</span>
                </span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/60">
                <span>📍 ស្លាក QR ៖ <code className="font-mono text-emerald-400 font-semibold">V2-STAND-{currentBranch.id}</code></span>
                <span>កាំកំណត់៖ <b>≤ {currentBranch.radiusMeters || 100}m</b></span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => setAttendanceType("CHECK_IN")}
                className={`py-2.5 rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
                  attendanceType === "CHECK_IN"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🟢 ចូលធ្វើការ (Check-In)</span>
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType("CHECK_OUT")}
                className={`py-2.5 rounded-xl text-xs font-bold font-battambang transition flex items-center justify-center gap-1.5 ${
                  attendanceType === "CHECK_OUT"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🟠 ចេញពីការងារ (Check-Out)</span>
              </button>
            </div>

            {/* Staff Selector */}
            <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>ជ្រើសរើសឈ្មោះរបស់អ្នក:</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {branchStaff.length} នាក់ក្នុងសាខានេះ
                </span>
              </label>

              <select
                value={selectedStaff?.id || ""}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {branchStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.role}
                  </option>
                ))}
              </select>

              {selectedStaff && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>វេនការងារ: <b className="text-slate-200">{selectedStaff.checkInTime} - {selectedStaff.checkOutTime}</b></span>
                  <PunctualityBadge punctuality={livePunctuality} size="sm" />
                </div>
              )}
            </div>

            {/* GPS Geofencing Status - STRICT 100M ENFORCEMENT */}
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                geofenceResult.isWithinGeofence
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/50 border-rose-500/60 text-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {geofenceResult.isWithinGeofence ? (
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">
                      GPS: {geofenceResult.isWithinGeofence ? "ក្នុងបរិវេណ (≤ ១០០m)" : "⛔ ក្រៅបរិវេណ (> ១០០m)"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currentBranch.nameKhmer} (ចម្ងាយ {geofenceResult.distanceMeters}m / កាំកំណត់ {currentBranch.radiusMeters || 100}m)
                    </div>
                  </div>
                </div>
                <button
                  onClick={refreshGpsLocation}
                  disabled={gpsLoading}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition"
                  title="Refresh GPS"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {geofenceResult.isWithinGeofence ? (
                <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-emerald-800/40 flex items-center gap-1">
                  <span>✅ ស្ថិតក្នុងបរិវេណកំណត់ ១០០m — អាចស្កេនបាន</span>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-rose-300 pt-1 border-t border-rose-800/40 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>⛔ មិនអាចស្កេនបានទេ! ចម្ងាយលើសពី ១០០ ម៉ែត្រពីទីតាំងកំណត់</span>
                </div>
              )}
            </div>

            {/* Submit Attendance Button - STRICT 100M GEOFENCE BLOCKAGE */}
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
                className="w-full py-4 bg-rose-900/60 hover:bg-rose-900/80 border-2 border-rose-500/80 text-rose-200 rounded-2xl font-bold font-battambang text-sm shadow-xl shadow-rose-950/40 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Lock className="w-5 h-5 text-rose-400 shrink-0" />
                <span>⛔ ក្រៅបរិវេណ &gt; ១០០m (ប្រព័ន្ធចាក់សោរមិនឱ្យស្កេន)</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleScanSubmit("CHECK_IN")}
                  disabled={isProcessing || !selectedStaff}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-bold font-battambang text-sm shadow-xl shadow-emerald-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing && attendanceType === "CHECK_IN" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
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
                  onClick={() => handleScanSubmit("CHECK_OUT")}
                  disabled={isProcessing || !selectedStaff}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white rounded-2xl font-bold font-battambang text-sm shadow-xl shadow-amber-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing && attendanceType === "CHECK_OUT" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
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

            {/* Link to Home Dashboard */}
            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700/80 text-xs font-semibold font-battambang transition"
              >
                <Home className="w-4 h-4 text-blue-400" />
                <span>ត្រឡប់ទៅផ្ទាំងដើម (Home Dashboard)</span>
              </Link>
            </div>
          </>
        )}
      </div>

      <footer className="mt-6 text-center text-xs text-slate-500">
        © 2026 V2aAttendence
      </footer>

      {/* Install to Mobile Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* ========================================================= */}
      {/* ⛔ GEOFENCE BLOCKED POPUP MODAL (STRICT 100M ENFORCEMENT) */}
      {/* ========================================================= */}
      {geofenceBlockedInfo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-kantumruy">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-rose-500 space-y-4 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8 text-rose-400" />
            </div>

            <div>
              <h3 className="font-bold text-base sm:text-lg font-battambang text-rose-400">
                ⛔ មិនអាចស្កេនវត្តមានបានទេ!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ក្រៅបរិវេណទីតាំងកំណត់ (Geofence Blocked)
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs text-left space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>សាខាគោលដៅ៖</span>
                <span className="font-bold text-white">{geofenceBlockedInfo.branchName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>ចម្ងាយបច្ចុប្បន្នរបស់អ្នក៖</span>
                <span className="font-bold text-rose-400 font-mono text-sm">{geofenceBlockedInfo.distanceMeters} ម៉ែត្រ</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>កាំអនុញ្ញាតអតិបរមា៖</span>
                <span className="font-bold text-emerald-400 font-mono">ត្រឹមតែ ១០០ ម៉ែត្រ</span>
              </div>
              <div className="pt-2 border-t border-slate-700 text-[11px] text-rose-300 leading-relaxed">
                📌 <b>លក្ខខណ្ឌកំណត់៖</b> រាល់ការស្កេនចេញ ឬស្កេនចូល ត្រូវតែស្ថិតក្នុងបរិវេណកន្លែងស្កេន (មិនលើសពី ១០០m)។ សូមចូលទៅក្នុងបរិវេណសាខា ដើម្បីស្កេនវត្តមាន។
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setGeofenceBlockedInfo(null);
                  refreshGpsLocation();
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
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>🗺️ មើលទីតាំងជាក់ស្តែងលើ Google Maps</span>
              </a>

              <button
                type="button"
                onClick={() => setGeofenceBlockedInfo(null)}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                បិទផ្ទាំងនេះ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffScannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">កំពុងដំណើរការ...</div>}>
      <StaffScannerContent />
    </Suspense>
  );
}
