"use client";

import React from "react";
import {
  ClipboardCheck,
  LayoutDashboard,
  CalendarDays,
  Users,
  Store,
  Sun,
  Moon,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { UserRole } from "@/lib/types/audit";

interface AppShellProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  page: string;
  setPage: (page: string) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  username: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ (Admin)",
  executive: "ผู้บริหาร (Executive)",
  area_manager: "ผู้จัดการเขต (Area Manager)",
  branch_manager: "ผู้จัดการสาขา (Branch Manager)",
  staff: "พนักงานประจำสาขา (Staff)",
};

export default function AppShell({
  role,
  setRole,
  page,
  setPage,
  dark,
  setDark,
  username,
  onLogout,
  children,
}: AppShellProps) {
  // All 5 sidebar tab items accessible to everyone without restriction
  const menuItems = [
    { key: "dashboard", label: "Dashboard ภาพรวม", icon: LayoutDashboard },
    { key: "audit_new", label: "เริ่มการตรวจประเมิน", icon: ClipboardCheck },
    { key: "audit_history", label: "ประวัติการตรวจประเมิน", icon: CalendarDays },
    { key: "employees", label: "จัดการพนักงาน", icon: Users },
    { key: "branches", label: "จัดการสาขา", icon: Store },
  ];

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-navy dark:text-slate-100 transition-colors">
        {/* Sidebar Navigation (Sticky Viewport Locked Height) */}
        <aside className="w-64 h-screen sticky top-0 bg-navy text-white flex flex-col p-4 border-r border-navy-dark shrink-0 z-30 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-audit-blue flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight leading-tight">Branch Audit</div>
              <div className="text-[11px] text-slate-300 font-medium">ระบบตรวจประเมินสาขา</div>
            </div>
          </div>

          {/* Menu Navigation (All items unlocked) */}
          <nav className="flex-1 my-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors rounded-lg whitespace-nowrap ${
                    active
                      ? "bg-white/15 text-white font-bold"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Clean User Profile & Controls (No Role Dropdown restriction) */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 px-2 py-1 text-xs">
              <UserCircle2 className="w-7 h-7 text-audit-sky shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white truncate">{username || "ผู้ใช้งานระบบ"}</div>
                <div className="text-[10px] text-slate-400 truncate">{ROLE_LABEL[role] || "เจ้าหน้าที่"}</div>
              </div>
            </div>

            {/* Dark Mode & Logout Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDark(!dark)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-xs font-medium text-white py-2 rounded-lg transition"
              >
                {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {dark ? "โหมดสว่าง" : "โหมดมืด"}
              </button>
              <button
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-xs font-medium text-rose-300 py-2 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
