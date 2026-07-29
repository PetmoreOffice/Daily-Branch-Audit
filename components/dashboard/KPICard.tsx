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
 <div className="gridgeist-card p-3.5 sm:p-4 min-h-[108px] flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 overflow-hidden">
 <div className="flex items-center justify-between gap-1.5 mb-2">
 <span className="text-xs sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{label}</span>
 <div
 className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center bg-slate-100/70 dark:bg-slate-800/80 shrink-0 transition-colors"
 style={{ color: accent || "#2C5AA0" }}
 >
 <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 </div>
 </div>
 <div className="flex flex-col justify-end">
 <div className="text-xl sm:text-2xl font-extrabold text-navy dark:text-slate-100 mb-1">{value}</div>
 {sub ? (
 <div className="text-xs sm:text-xs text-slate-400 dark:text-slate-500 font-medium truncate" title={sub}>
 {sub}
 </div>
 ) : (
 <div className="text-xs sm:text-xs text-transparent font-medium select-none">
 -
 </div>
 )}
 </div>
 </div>
 );
}
