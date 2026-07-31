"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import LoginPage, { inferRoleFromEmail } from "@/components/auth/LoginPage";
import { UserRole, Audit } from "@/lib/types/audit";
import { syncEmployees, syncBranches } from "@/lib/mock-data";
import { getEmployees, getBranches } from "@/app/actions/employee";
import { saveAudit, getAudits } from "@/app/actions/audit";
import { supabase } from "@/lib/supabase";

// ── Lazy-loaded page components (reduces initial bundle size) ──────────────
const PageLoader = () => (
  <div className="p-8 flex justify-center items-center">
    <div className="w-8 h-8 border-2 border-audit-blue border-t-transparent rounded-full animate-spin" />
  </div>
);

const DashboardOverview = dynamic(
  () => import("@/components/dashboard/DashboardOverview"),
  { loading: () => <PageLoader /> }
);
const NewAuditWizard = dynamic(
  () => import("@/components/audit/NewAuditWizard"),
  { loading: () => <PageLoader /> }
);
const AuditHistory = dynamic(
  () => import("@/components/audit/AuditHistory"),
  { loading: () => <PageLoader /> }
);
const EmployeeDirectory = dynamic(
  () => import("@/components/employees/EmployeeDirectory"),
  { loading: () => <PageLoader /> }
);
const BranchDirectory = dynamic(
  () => import("@/components/branches/BranchDirectory"),
  { loading: () => <PageLoader /> }
);
const ActionItemsTracker = dynamic(
  () => import("@/components/action-items/ActionItemsTracker"),
  { loading: () => <PageLoader /> }
);

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true); // prevent flash
  const [role, setRole] = useState<UserRole>("area_manager");
  const [username, setUsername] = useState<string>("");
  const [page, setPage] = useState<string>("dashboard");
  const [dark, setDark] = useState<boolean>(false);
  const [auditsList, setAuditsList] = useState<Audit[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Sync page state with URL hash for browser back/forward support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setPage(hash);
    };
    if (window.location.hash) handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSetPage = useCallback((newPage: string) => {
    setPage(newPage);
    window.location.hash = newPage;
  }, []);

  const loadAuditsFromDb = useCallback(async () => {
    try {
      const dbAudits = await getAudits();
      if (Array.isArray(dbAudits)) setAuditsList(dbAudits);
    } catch (err) {
      console.error("Failed to load audits from DB:", err);
    }
  }, []);

  const syncStaticData = useCallback(async () => {
    try {
      const [emps, branches] = await Promise.all([getEmployees(), getBranches()]);
      if (emps && emps.length > 0) syncEmployees(emps);
      if (branches && branches.length > 0) syncBranches(branches);
    } catch (err) {
      console.error("Error syncing static data:", err);
    }
  }, []);

  // ── #1 Session Persistence: check for existing Supabase session on mount ──
  useEffect(() => {
    let realtimeSub: ReturnType<typeof supabase.channel> | null = null;

    async function initSession() {
      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const userEmail = session.user.email || "";
        const displayName = session.user.user_metadata?.fullName || userEmail;
        const assignedRole = (session.user.user_metadata?.role as UserRole) || inferRoleFromEmail(userEmail);
        setRole(assignedRole);
        setUsername(displayName);
        setIsAuthenticated(true);

        // Load data now that we know we're authenticated
        await Promise.all([syncStaticData(), loadAuditsFromDb()]);

        // ── #2 Replace polling with Supabase Realtime ──
        realtimeSub = supabase
          .channel("audits-realtime")
          .on("postgres_changes", { event: "*", schema: "public", table: "Audit" }, () => {
            loadAuditsFromDb();
          })
          .subscribe();
      }

      setAuthLoading(false);
    }

    initSession();

    // Listen for future auth state changes (login/logout from other tabs)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userEmail = session.user.email || "";
        const displayName = session.user.user_metadata?.fullName || userEmail;
        const assignedRole = (session.user.user_metadata?.role as UserRole) || inferRoleFromEmail(userEmail);
        setRole(assignedRole);
        setUsername(displayName);
        setIsAuthenticated(true);
        await Promise.all([syncStaticData(), loadAuditsFromDb()]);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUsername("");
        setAuditsList([]);
        setPage("dashboard");
      }
    });

    return () => {
      authSub.unsubscribe();
      if (realtimeSub) supabase.removeChannel(realtimeSub);
    };
  }, [loadAuditsFromDb, syncStaticData]);

  function handleDrillBranch(_branchId: string) {
    setPage("audit_history");
  }

  function handleSelectEmployee(empId: string) {
    setSelectedEmployeeId(empId);
    setPage("employees");
  }

  async function handleAuditSubmit(newAudit: Audit) {
    // Optimistic update for instant UI feedback
    setAuditsList((prev) => [newAudit, ...prev]);
    setPage("audit_history");

    try {
      await saveAudit(newAudit);
      await loadAuditsFromDb();
    } catch (err) {
      console.warn("Could not persist audit to DB — kept in local memory:", err);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    // onAuthStateChange will handle resetting state
  }

  // Prevent login flash while checking session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-audit-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(selectedRole, user) => {
          setRole(selectedRole);
          setUsername(user);
          setIsAuthenticated(true);
          Promise.all([syncStaticData(), loadAuditsFromDb()]);
        }}
      />
    );
  }

  return (
    <AppShell
      role={role}
      setRole={setRole}
      page={page}
      setPage={handleSetPage}
      dark={dark}
      setDark={setDark}
      username={username}
      onLogout={handleLogout}
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

      {page === "action_items" && <ActionItemsTracker audits={auditsList} />}
    </AppShell>
  );
}
