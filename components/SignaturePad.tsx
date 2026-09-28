"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, CheckCircle2, Edit3 } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  initialSignature?: string;
  applicantName?: string;
}

export default function SignaturePad({
  onSignatureChange,
  initialSignature,
  applicantName,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize and handle DPI
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set internal resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1e3a8a"; // Deep navy ink

    // Clear with white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  // Coordinate helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capture pointer
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Export signature as PNG data URL
    const dataUrl = canvas.toDataURL("image/png");
    setHasDrawn(true);
    onSignatureChange(dataUrl);
  };

  const clearSignature = () => {
    initCanvas();
    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-battambang">
          <Edit3 className="w-4 h-4 text-blue-600" />
          <span>គូសហត្ថលេខាសាមីខ្លួន (Digital Signature)</span>
          <span className="text-rose-500">*</span>
        </label>

        {hasDrawn ? (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>បានគូសហត្ថលេខា</span>
          </span>
        ) : (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            (សូមគូសហត្ថលេខាដោយម្រាមដៃ ឬ Mouse)
          </span>
        )}
      </div>

      {/* Signature Canvas Box */}
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl overflow-hidden bg-white shadow-xs transition">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          style={{ touchAction: "none" }}
          className="w-full h-36 cursor-crosshair block select-none"
        />

        {/* Placeholder Watermark (Visible when not yet drawn) */}
        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-400 select-none">
            <Edit3 className="w-7 h-7 mb-1 opacity-50 text-blue-500" />
            <p className="text-xs font-medium font-kantumruy">
              ✍️ គូសហត្ថលេខានៅទីនេះ (Sign Here)
            </p>
            {applicantName && (
              <p className="text-[10px] text-slate-400 mt-0.5 font-battambang">
                {applicantName}
              </p>
            )}
          </div>
        )}

        {/* Dotted Baseline */}
        <div className="pointer-events-none absolute bottom-5 left-8 right-8 border-b border-dashed border-slate-200" />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-400">
          ហត្ថលេខានឹងត្រូវបោះត្រាលើលិខិតសុំច្បាប់ផ្លូវការ
        </span>

        {hasDrawn && (
          <button
            type="button"
            onClick={clearSignature}
            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center gap-1 active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>គូសឡើងវិញ (Clear)</span>
          </button>
        )}
      </div>
    </div>
  );
}
