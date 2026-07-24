"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import NewAuditWizard from "@/components/audit/NewAuditWizard";
import AuditHistory from "@/components/audit/AuditHistory";
import EmployeeDirectory from "@/components/employees/EmployeeDirectory";
import BranchDirectory from "@/components/branches/BranchDirectory";
import LoginPage from "@/components/auth/LoginPage";
import { UserRole, Audit } from "@/lib/types/audit";
import { syncEmployees } from "@/lib/mock-data";
import { getEmployees } from "@/app/actions/employee";
import { saveAudit, getAudits } from "@/app/actions/audit";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>("area_manager");
  const [username, setUsername] = useState<string>("");
  const [page, setPage] = useState<string>("dashboard");
  const [dark, setDark] = useState<boolean>(false);
  const [auditsList, setAuditsList] = useState<Audit[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Load data from DB on mount (employee sync)
  useEffect(() => {
    async function initDbSync() {
      try {
        const emps = await getEmployees();
        if (emps && emps.length > 0) syncEmployees(emps);
      } catch {}
    }
    initDbSync();
  }, []);

  // Load audits from DB when authenticated
  const loadAuditsFromDb = useCallback(async () => {
    try {
      const dbAudits = await getAudits();
      if (dbAudits && dbAudits.length > 0) {
        setAuditsList(dbAudits);
      }
    } catch (err) {
      // Keep local state if DB unavailable
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAuditsFromDb();
    }
  }, [isAuthenticated, loadAuditsFromDb]);

  function handleDrillBranch(_branchId: string) {
    setPage("audit_history");
  }

  function handleSelectEmployee(empId: string) {
    setSelectedEmployeeId(empId);
    setPage("employees");
  }

  async function handleAuditSubmit(newAudit: Audit) {
    // Add to local state immediately for instant UI feedback
    setAuditsList((prev) => [newAudit, ...prev]);
    setPage("audit_history");

    // Save to DB in background
    try {
      await saveAudit(newAudit);
      // Reload from DB to get canonical data (handles ID generation etc.)
      await loadAuditsFromDb();
    } catch (err) {
      console.warn("Could not persist audit to DB — kept in local memory:", err);
    }
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(selectedRole, user) => {
          setRole(selectedRole);
          setUsername(user);
          setIsAuthenticated(true);
        }}
      />
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
      onLogout={() => {
        setIsAuthenticated(false);
        setUsername("");
        setAuditsList([]);
        setPage("dashboard");
      }}
    >
      {page === "dashboard" && (
        <DashboardOverview
          audits={auditsList}
          onDrillBranch={handleDrillBranch}
          onSelectEmployee={handleSelectEmployee}
        />
      )}

      {page === "audit_new" && (
        <NewAuditWizard auditorName={username} onSubmit={handleAuditSubmit} />
      )}

      {page === "audit_history" && <AuditHistory audits={auditsList} />}

      {page === "employees" && <EmployeeDirectory selectedEmployeeId={selectedEmployeeId} />}

      {page === "branches" && <BranchDirectory audits={auditsList} onDrillBranch={handleDrillBranch} />}
    </AppShell>
  );
}
