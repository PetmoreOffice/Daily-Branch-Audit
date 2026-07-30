"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  trend?: { value: number; label?: string }; // +/- % or count
}

export default function KPICard({ icon: Icon, label, value, sub, accent = "#2C5AA0", trend }: KPICardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div
      className="gridgeist-card relative flex flex-col justify-between min-h-[112px] p-4 sm:p-5 overflow-hidden hover:shadow-md transition-all duration-200"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {/* Background accent glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 opacity-90"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Value */}
      <div className="flex flex-col gap-0.5">
        <div className="text-2xl font-black text-navy dark:text-slate-100 tracking-tight leading-none">
          {value}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {sub && (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate" title={sub}>
              {sub}
            </span>
          )}
          {trend && (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                trendPositive
                  ? "text-emerald-700 bg-emerald-50"
                  : trendNegative
                  ? "text-rose-700 bg-rose-50"
                  : "text-slate-500 bg-slate-100"
              }`}
            >
              {trendPositive ? "▲" : trendNegative ? "▼" : "—"}
              {trend.label || Math.abs(trend.value)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
