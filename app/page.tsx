"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import NewAuditWizard from "@/components/audit/NewAuditWizard";
import AuditHistory from "@/components/audit/AuditHistory";
import EmployeeDirectory from "@/components/employees/EmployeeDirectory";
import BranchDirectory from "@/components/branches/BranchDirectory";
import { UserRole, Audit } from "@/lib/types/audit";
import { SEED_AUDITS, branchName } from "@/lib/mock-data";
import { ClipboardCheck, Lock } from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>("area_manager");
  const [username, setUsername] = useState<string>("areeya.a");
  const [page, setPage] = useState<string>("dashboard");
  const [dark, setDark] = useState<boolean>(false);
  const [auditsList, setAuditsList] = useState<Audit[]>(SEED_AUDITS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Drill down from Dashboard to Audit History filtered by branch
  function handleDrillBranch(branchId: string) {
    setPage("audit_history");
  }

  // Drill down to Employee Details
  function handleSelectEmployee(empId: string) {
    setSelectedEmployeeId(empId);
    setPage("employees");
  }

  // Add new submitted audit
  function handleAuditSubmit(newAudit: Audit) {
    setAuditsList((prev) => [newAudit, ...prev]);
    setPage("audit_history");
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="gridgeist-card p-8 max-w-sm w-full bg-white space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-bold">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-navy leading-tight">Branch Audit</h1>
              <p className="text-xs text-audit-slate">ระบบตรวจประเมินสาขา</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsAuthenticated(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-audit-hairline rounded-lg px-3 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Password</label>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full bg-slate-50 border border-audit-hairline rounded-lg px-3 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">เข้าสู่ระบบในฐานะ (สำหรับสาธิต)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-audit-hairline rounded-lg px-3 py-2 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
              >
                <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                <option value="executive">ผู้บริหาร (Executive)</option>
                <option value="area_manager">ผู้จัดการเขต (Area Manager)</option>
                <option value="branch_manager">ผู้จัดการสาขา</option>
                <option value="staff">พนักงานประจำสาขา</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-audit-blue text-white py-2.5 rounded-xl font-bold text-sm shadow hover:bg-navy transition"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      role={role}
      setRole={setRole}
      page={page}
      setPage={setPage}
      dark={dark}
      setDark={setDark}
      username={username}
      onLogout={() => setIsAuthenticated(false)}
    >
      {page === "dashboard" && (
        <DashboardOverview
          audits={auditsList}
          onDrillBranch={handleDrillBranch}
          onSelectEmployee={handleSelectEmployee}
        />
      )}

      {page === "audit_new" && <NewAuditWizard onSubmit={handleAuditSubmit} />}

      {page === "audit_history" && <AuditHistory audits={auditsList} />}

      {page === "employees" && <EmployeeDirectory selectedEmployeeId={selectedEmployeeId} />}

      {page === "branches" && <BranchDirectory onDrillBranch={handleDrillBranch} />}
    </AppShell>
  );
}
