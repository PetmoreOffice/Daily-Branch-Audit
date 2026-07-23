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
    <div className="gridgeist-card p-4 flex-1 min-w-[170px]">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: accent || "#2C5AA0" }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-audit-slate">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-navy leading-none tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-audit-slate mt-1.5 font-medium">{sub}</div>}
    </div>
  );
}
