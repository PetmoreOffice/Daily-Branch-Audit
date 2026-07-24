"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export default function KPICard({ icon: Icon, label, value, sub, accent }: KPICardProps) {
  return (
    <div className="p-4 bg-white rounded-xl border border-audit-hairline shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50"
          style={{ color: accent || "#2C5AA0" }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-navy tracking-tight">{value}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{sub}</div>}
      </div>
    </div>
  );
}
