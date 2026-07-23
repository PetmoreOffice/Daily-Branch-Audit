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

const ROLES_MENU: Record<UserRole, string[]> = {
  admin: ["dashboard", "audit_new", "audit_history", "employees", "branches"],
  executive: ["dashboard", "audit_history"],
  area_manager: ["dashboard", "audit_new", "audit_history"],
  branch_manager: ["dashboard", "audit_history"],
  staff: ["audit_history"],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin (ผู้ดูแลระบบ)",
  executive: "ผู้บริหาร (Executive)",
  area_manager: "ผู้จัดการเขต (Area Manager)",
  branch_manager: "ผู้จัดการสาขา",
  staff: "พนักงานประจำสาขา",
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
  const menuItems = [
    { key: "dashboard", label: "Dashboard ภาพรวม", icon: LayoutDashboard },
    { key: "audit_new", label: "เริ่มการตรวจประเมิน", icon: ClipboardCheck },
    { key: "audit_history", label: "ประวัติการตรวจประเมิน", icon: CalendarDays },
    { key: "employees", label: "จัดการพนักงาน", icon: Users },
    { key: "branches", label: "จัดการสาขา", icon: Store },
  ].filter((item) => ROLES_MENU[role]?.includes(item.key));

  return (
    <div className={`flex min-h-screen ${dark ? "bg-slate-950 text-slate-100" : "bg-audit-bg text-navy"}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white flex flex-col p-4 shadow-xl border-r border-navy-light shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pb-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-audit-blue flex items-center justify-center shadow-md">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight leading-tight">Branch Audit</div>
            <div className="text-[11px] text-slate-300 font-medium">ระบบตรวจประเมินสาขา</div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 my-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? "bg-white/15 text-white shadow-sm border-l-4 border-audit-sky"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Role Quick Switcher & User Status */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="px-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              สลับสิทธิ์ใช้งาน (สาธิต)
            </label>
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setRole(newRole);
                if (!ROLES_MENU[newRole].includes(page)) {
                  setPage(ROLES_MENU[newRole][0]);
                }
              }}
              className="w-full bg-navy-dark text-slate-200 border border-white/15 text-xs rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-audit-sky"
            >
              {Object.keys(ROLE_LABEL).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r as UserRole]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 px-2 py-1 text-xs">
            <UserCircle2 className="w-6 h-6 text-audit-sky" />
            <div className="truncate">
              <div className="font-bold text-white truncate">{username}</div>
              <div className="text-[10px] text-slate-400 truncate">{ROLE_LABEL[role]}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDark(!dark)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-xs font-medium text-white py-1.5 rounded-md transition"
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {dark ? "สว่าง" : "มืด"}
            </button>
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-xs font-medium text-rose-300 py-1.5 rounded-md transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออก
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
