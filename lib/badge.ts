import { AttendanceType } from "@/types";

export interface BadgeOptions {
  type: AttendanceType;
  staffName: string;
  staffRole: string;
  branchName: string;
  branchId: string;
  formattedTime: string;
  formattedDate: string;
  punctualityLabel: string;
  geofenceStatus: string;
  distanceMeters: number;
}

/**
 * Generate a high-resolution, perfectly-fitted modern attendance badge image
 * for Telegram dispatch and records.
 */
export function generateAttendanceBadgeImage(options: BadgeOptions): string {
  if (typeof document === "undefined") return "";

  const width = 800;
  const height = 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const isCheckIn = options.type === "CHECK_IN";

  // 1. Background Rich Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (isCheckIn) {
    grad.addColorStop(0, "#064e3b"); // emerald 900
    grad.addColorStop(0.5, "#022c22"); // deep emerald
    grad.addColorStop(1, "#0f172a"); // slate 900
  } else {
    grad.addColorStop(0, "#831843"); // rich wine/amber rose
    grad.addColorStop(0.5, "#431407"); // deep amber
    grad.addColorStop(1, "#0f172a"); // slate 900
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Decorative glow circles
  ctx.fillStyle = isCheckIn ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)";
  ctx.beginPath();
  ctx.arc(width - 60, 60, 160, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.beginPath();
  ctx.arc(60, height - 60, 140, 0, Math.PI * 2);
  ctx.fill();

  // 2. Card Inner Frame
  const pad = 24;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1.5;
  ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 24, true, true);

  // 3. Top Row: App Brand & Branch Pill
  ctx.font = "bold 22px 'Battambang', -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("V2aAttendence", pad + 24, pad + 40);

  // Branch badge pill
  const branchText = `🏫 បញ្ជាក់សាខា៖ ${options.branchName} (${options.branchId})`;
  ctx.font = "bold 14px 'Battambang', -apple-system, sans-serif";
  const branchMetrics = ctx.measureText(branchText);
  const pillW = branchMetrics.width + 24;
  const pillH = 32;
  const pillX = width - pad - 24 - pillW;
  const pillY = pad + 18;

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY, pillW, pillH, 16, true, true);

  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.fillText(branchText, pillX + 12, pillY + 21);

  // Subtle divider line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 24, pad + 65);
  ctx.lineTo(width - pad - 24, pad + 65);
  ctx.stroke();

  // 4. Center Action Status Pill
  const actionText = isCheckIn ? "🟢 CHECK-IN វត្តមានចូល" : "🟠 CHECK-OUT វត្តមានចេញ";
  ctx.font = "bold 17px 'Battambang', -apple-system, sans-serif";
  const actionMetrics = ctx.measureText(actionText);
  const actPillW = actionMetrics.width + 36;
  const actPillH = 36;
  const actPillX = (width - actPillW) / 2;
  const actPillY = pad + 85;

  ctx.fillStyle = isCheckIn ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)";
  ctx.strokeStyle = isCheckIn ? "#10b981" : "#f59e0b";
  ctx.lineWidth = 1.5;
  roundRect(ctx, actPillX, actPillY, actPillW, actPillH, 18, true, true);

  ctx.fillStyle = isCheckIn ? "#6ee7b7" : "#fde68a";
  ctx.textAlign = "center";
  ctx.fillText(actionText, width / 2, actPillY + 24);

  // 5. Staff Name (Auto-scale font size so it NEVER overflows!)
  let staffFontSize = 34;
  ctx.font = `bold ${staffFontSize}px 'Battambang', -apple-system, sans-serif`;
  let staffMetrics = ctx.measureText(options.staffName);
  const maxTextWidth = width - pad * 2 - 48;
  while (staffMetrics.width > maxTextWidth && staffFontSize > 18) {
    staffFontSize -= 2;
    ctx.font = `bold ${staffFontSize}px 'Battambang', -apple-system, sans-serif`;
    staffMetrics = ctx.measureText(options.staffName);
  }
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(options.staffName, width / 2, pad + 180);

  // 6. Staff Role
  ctx.font = "16px 'Battambang', -apple-system, sans-serif";
  ctx.fillStyle = "#94a3b8"; // slate 400
  ctx.fillText(options.staffRole, width / 2, pad + 218);

  // 7. Time & Date (Clean large digital font)
  const timeText = `${options.formattedTime}   •   ${options.formattedDate}`;
  ctx.font = "bold 22px monospace, sans-serif";
  ctx.fillStyle = "#38bdf8"; // sky 400
  ctx.fillText(timeText, width / 2, pad + 265);

  // 8. Bottom Badges Row
  const bottomY = height - pad - 55;

  // Left Badge: GPS Status
  const gpsText = `📍 ${options.geofenceStatus} (${options.distanceMeters}m)`;
  ctx.font = "bold 13px 'Battambang', -apple-system, sans-serif";
  const gpsMetrics = ctx.measureText(gpsText);
  const gpsW = gpsMetrics.width + 24;
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  roundRect(ctx, pad + 24, bottomY, gpsW, 34, 17, true, true);
  ctx.fillStyle = "#cbd5e1";
  ctx.textAlign = "left";
  ctx.fillText(gpsText, pad + 36, bottomY + 22);

  // Right Badge: Punctuality Status
  const puncText = options.punctualityLabel;
  ctx.font = "bold 13px 'Battambang', -apple-system, sans-serif";
  const puncMetrics = ctx.measureText(puncText);
  const puncW = puncMetrics.width + 24;
  const puncX = width - pad - 24 - puncW;
  ctx.fillStyle = isCheckIn ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)";
  ctx.strokeStyle = isCheckIn ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 1;
  roundRect(ctx, puncX, bottomY, puncW, 34, 17, true, true);
  ctx.fillStyle = isCheckIn ? "#a7f3d0" : "#fef08a";
  ctx.textAlign = "left";
  ctx.fillText(puncText, puncX + 12, bottomY + 22);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = true,
  stroke = true
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
