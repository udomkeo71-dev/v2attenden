import React from "react";
import { PunctualityResult } from "@/types";
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

interface PunctualityBadgeProps {
  punctuality: PunctualityResult;
  size?: "sm" | "md" | "lg";
}

export const PunctualityBadge: React.FC<PunctualityBadgeProps> = ({
  punctuality,
  size = "md",
}) => {
  const getIcon = () => {
    switch (punctuality.status) {
      case "EARLY":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />;
      case "ON_TIME":
      case "ON_TIME_LEAVE":
        return <Clock className="w-3.5 h-3.5 text-blue-600 mr-1 shrink-0" />;
      case "LATE":
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600 mr-1 shrink-0" />;
      case "EARLY_LEAVE":
        return <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 mr-1 shrink-0" />;
    }
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs font-semibold px-2.5 py-1",
    lg: "text-sm font-semibold px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs font-kantumruy transition-all ${punctuality.badgeClass} ${sizeClasses[size]}`}
    >
      {getIcon()}
      <span>{punctuality.labelKhmer}</span>
    </span>
  );
};
