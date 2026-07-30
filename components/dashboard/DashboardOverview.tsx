"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ClipboardCheck, CalendarDays, Star, FileWarning, AlertTriangle,
  ChevronRight, X, LayoutDashboard, PlusCircle, BarChart3, Users2,
  Filter,
} from "lucide-react";
import KPICard from "./KPICard";
import SectionScorePanel from "./SectionScorePanel";
import BranchRankingPanel from "./BranchRankingPanel";
import EmployeeHistoryModal from "@/components/modals/EmployeeHistoryModal";
import SectionDefectsModal from "@/components/modals/SectionDefectsModal";
import { Audit } from "@/lib/types/audit";
import {
  BRANCHES, EMPLOYEES, TEMPLATE, ALL_ITEMS, avgScore, branchName,
  isSameBranch,
} from "@/lib/mock-data";

interface DashboardOverviewProps {
  audits: Audit[];
  onDrillBranch: (branchId: string) => void;
  onSelectEmployee: (empId: string) => void;
}

const PIE_COLORS = ["#2C5AA0", "#5B8DEF", "#8FB3E8", "#12294B", "#C77C00"];

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(8px)",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  fontSize: "13px",
  color: "#0f172a",
  padding: "10px 14px",
};

export default function DashboardOverview({
  audits,
  onDrillBranch,
  onSelectEmployee,
}: DashboardOverviewProps) {
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [selectedEmpModalId, setSelectedEmpModalId] = useState<string | null>(null);
  const [empFilterTab, setEmpFilterTab] = useState<"all" | "defects">("all");

  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayLabel = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const monthLabel = new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const months = useMemo(() => {
    const set = new Set(audits.map((a) => a.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [audits]);

  const filtered = useMemo(
    () => (monthFilter === "all" ? audits : audits.filter((a) => a.date.startsWith(monthFilter))),
    [audits, monthFilter]
  );

  const todayCount = useMemo(() => audits.filter((a) => a.date === todayStr).length, [audits, todayStr]);
  const monthCount = useMemo(() => audits.filter((a) => a.date.startsWith(thisMonth)).length, [audits, thisMonth]);
  const allItemScores = useMemo(() => filtered.flatMap((a) => a.items), [filtered]);
  const overallAvg = useMemo(() => avgScore(allItemScores), [allItemScores]);

  const branchAverages = useMemo(() => {
    const list = BRANCHES.map((b) => {
      const items = filtered.filter((a) => isSameBranch(a.branchId, b)).flatMap((a) => a.items);
      return { branch: b, avg: avgScore(items) };
    }).filter((x) => x.avg > 0);
    return list.sort((a, b) => b.avg - a.avg);
  }, [filtered]);

  const failingItems = useMemo(() => allItemScores.filter((i) => i.status !== "ผ่าน").length, [allItemScores]);
  const openActions = useMemo(
    () => allItemScores.filter((i) => i.status !== "ผ่าน" && i.photosAfter.length === 0).length,
    [allItemScores]
  );

  const monthlyTrend = useMemo(() => {
    return months.map((m) => {
      const items = audits.filter((a) => a.date.startsWith(m)).flatMap((a) => a.items);
      return { month: m.slice(2), score: Number(avgScore(items).toFixed(2)) };
    });
  }, [audits, months]);

  const byBranchChart = useMemo(() => {
    return branchAverages.map((x) => ({
      name: x.branch.code,
      score: Number(x.avg.toFixed(2)),
      branchId: x.branch.id,
    }));
  }, [branchAverages]);

  const bySectionChart = useMemo(() => {
    return TEMPLATE.sections.map((s) => {
      const ids = s.items.map((i) => i.id);
      const items = allItemScores.filter((i) => ids.includes(i.itemId));
      return { name: s.name, score: Number(avgScore(items).toFixed(2)) };
    });
  }, [allItemScores]);

  const defectPie = useMemo(() => {
    return TEMPLATE.sections.map((s) => {
      const ids = s.items.map((i) => i.id);
      const count = allItemScores.filter((i) => ids.includes(i.itemId) && i.status !== "ผ่าน").length;
      return { name: s.name.replace(/^\d+\.\s*/, ""), value: count };
    }).filter((d) => d.value > 0);
  }, [allItemScores]);

  const employeeStats = useMemo(() => {
    return EMPLOYEES.map((e) => {
      const related = filtered.flatMap((a) => a.items.filter((i) => i.responsibleIds.includes(e.id)));
      const failCount = related.filter((i) => i.status !== "ผ่าน").length;
      return { employee: e, tagCount: related.length, failCount, avg: avgScore(related) };
    }).filter((x) => x.tagCount > 0);
  }, [filtered]);

  const mostTagged = useMemo(() => [...employeeStats].sort((a, b) => b.tagCount - a.tagCount).slice(0, 8), [employeeStats]);
  const mostFlagged = useMemo(
    () => [...employeeStats].filter((x) => x.failCount > 0).sort((a, b) => b.failCount - a.failCount).slice(0, 8),
    [employeeStats]
  );

  const [selectedSectionModalName, setSelectedSectionModalName] = useState<string | null>(null);

  // Employee modal
  const selectedEmpModal = useMemo(() =>
    selectedEmpModalId ? EMPLOYEES.find((e) => e.id === selectedEmpModalId) || null : null,
    [selectedEmpModalId]
  );

  const selectedEmpHistory = useMemo(() => {
    if (!selectedEmpModalId) return [];
    const list: { auditId: string; date: string; branchId: string; auditor: string; itemId: string; score: number; status: string; note: string }[] = [];
    filtered.forEach((a) => {
      a.items.forEach((i) => {
        if (i.responsibleIds.includes(selectedEmpModalId)) {
          list.push({ auditId: a.id, date: a.date, branchId: a.branchId, auditor: a.auditor, itemId: i.itemId, score: i.score, status: i.status, note: i.note });
        }
      });
    });
    return list.sort((x, y) => y.date.localeCompare(x.date));
  }, [filtered, selectedEmpModalId]);

  const selectedSectionHistory = useMemo(() => {
    if (!selectedSectionModalName) return [];
    const sec = TEMPLATE.sections.find(
      (s) =>
        s.name === selectedSectionModalName ||
        s.name.includes(selectedSectionModalName) ||
        selectedSectionModalName.includes(s.name.replace(/^\d+\.\s*/, ""))
    );
    if (!sec) return [];
    const itemIds = sec.items.map((i) => i.id);

    const list: {
      auditId: string;
      date: string;
      branchId: string;
      auditor: string;
      itemId: string;
      score: number;
      status: string;
      note: string;
      responsibleIds: string[];
      photosBefore: string[];
      photosAfter: string[];
    }[] = [];

    filtered.forEach((a) => {
      a.items.forEach((i) => {
        if (itemIds.includes(i.itemId) && i.status !== "ผ่าน") {
          list.push({
            auditId: a.id,
            date: a.date,
            branchId: a.branchId,
            auditor: a.auditor,
            itemId: i.itemId,
            score: i.score,
            status: i.status,
            note: i.note,
            responsibleIds: i.responsibleIds || [],
            photosBefore: i.photosBefore || [],
            photosAfter: i.photosAfter || [],
          });
        }
      });
    });

    return list.sort((x, y) => y.date.localeCompare(x.date));
  }, [filtered, selectedSectionModalName]);

  function getItemDetails(itemId: string) {
    if (!itemId) return { sectionName: "หมวดการประเมิน", itemTitle: "หัวข้อการประเมิน" };
    for (const sec of TEMPLATE.sections) {
      const it = sec.items.find((x) => x.id === itemId);
      if (it) return { sectionName: sec.name, itemTitle: it.name };
    }
    for (const sec of TEMPLATE.sections) {
      const it = sec.items.find((x) => x.name === itemId);
      if (it) return { sectionName: sec.name, itemTitle: it.name };
    }
    const foundAll = ALL_ITEMS.find((x) => x.id === itemId || x.name === itemId);
    if (foundAll) {
      const sec = TEMPLATE.sections.find((s) => s.items.some((i) => i.id === foundAll.id));
      return { sectionName: sec?.name || foundAll.section || "หมวดการประเมิน", itemTitle: foundAll.name };
    }
    if (/^[a-z0-9]{20,}$/i.test(itemId)) return { sectionName: "หมวดการประเมินทั่วไป", itemTitle: "หัวข้อประเมินประจำสาขา" };
    return { sectionName: "หมวดการประเมิน", itemTitle: itemId };
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy dark:text-slate-100 tracking-tight">
            Dashboard ภาพรวมการประเมิน
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            วิเคราะห์ผลตรวจประเมินสาขาและประสิทธิภาพพนักงานแบบ Real-time
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">ช่วงเวลา:</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-audit-hairline dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2 text-navy dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-audit-blue transition shadow-sm"
          >
            <option value="all">ทุกเดือน (6 เดือนล่าสุด)</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Empty State ── */}
      {audits.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-audit-hairline bg-white dark:bg-slate-800/50 p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-audit-tint flex items-center justify-center">
            <LayoutDashboard className="w-8 h-8 text-audit-blue" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-navy dark:text-slate-100 mb-1">ยังไม่มีข้อมูลการประเมิน</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              เริ่มทำการตรวจประเมินสาขาเพื่อดูข้อมูลสถิติ กราฟ และ KPI แบบ Real-time ที่นี่
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-audit-hairline">
              <PlusCircle className="w-3.5 h-3.5 text-audit-blue" /> เริ่มตรวจประเมินสาขาใหม่
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-audit-hairline">
              <BarChart3 className="w-3.5 h-3.5 text-audit-blue" /> กราฟ &amp; Analytics จะแสดงที่นี่
            </div>
          </div>
        </div>
      )}

      {/* ── Row 1: 4 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          icon={CalendarDays}
          label="ตรวจเดือนนี้"
          value={monthCount}
          sub={monthLabel}
          accent="#2C5AA0"
        />
        <KPICard
          icon={Star}
          label="คะแนนเฉลี่ยรวม"
          value={overallAvg > 0 ? `${overallAvg.toFixed(2)} / 5` : "–"}
          sub={overallAvg >= 4 ? "อยู่ในเกณฑ์ดี" : overallAvg >= 3 ? "ต้องปรับปรุง" : overallAvg > 0 ? "อยู่ในเกณฑ์ต่ำ" : undefined}
          accent={overallAvg >= 4 ? "#1E8E5A" : overallAvg >= 3 ? "#C77C00" : "#C23B3B"}
        />
        <KPICard
          icon={FileWarning}
          label="หัวข้อไม่ผ่าน"
          value={failingItems}
          sub={failingItems > 0 ? "พบข้อบกพร่องในรอบนี้" : "ผ่านทั้งหมด"}
          accent="#C77C00"
        />
        <KPICard
          icon={AlertTriangle}
          label="Action ค้างแก้ไข"
          value={openActions}
          sub={openActions > 0 ? "ยังไม่มีภาพหลังแก้ไข" : "ครบถ้วนทุกรายการ"}
          accent={openActions > 0 ? "#C23B3B" : "#1E8E5A"}
        />
      </div>

      {/* ── Row 2: Trend + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Trend Area Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-navy dark:text-slate-100">คะแนนเฉลี่ยรายเดือน</h3>
            <p className="text-xs text-slate-400 mt-0.5">แนวโน้ม 6 เดือนล่าสุด</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2C5AA0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2C5AA0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={10} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#0f172a", fontWeight: 700 }} cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="score" stroke="#2C5AA0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 5, fill: "#2C5AA0", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Donut */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-navy dark:text-slate-100">สัดส่วนข้อบกพร่อง</h3>
            <p className="text-xs text-slate-400 mt-0.5">แยกตามหมวดประเมิน (คลิกเพื่อดูข้อบกพร่อง)</p>
          </div>
          {defectPie.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-slate-400 flex-col gap-2">
              <span className="text-3xl">✅</span>
              <span>ไม่พบข้อบกพร่องในช่วงนี้</span>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={75}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                      if (percent < 0.04) return null;
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#ffffff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={800}
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    cursor="pointer"
                    onClick={(entry) => {
                      if (entry && entry.name) {
                        setSelectedSectionModalName(entry.name);
                      }
                    }}
                  >
                    {defectPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#0f172a", fontWeight: 700 }} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "8px" }} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Branch Bar + Section Progress ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Branch Bar Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-navy dark:text-slate-100">คะแนนเฉลี่ยแต่ละสาขา</h3>
            <p className="text-xs text-slate-400 mt-0.5">คลิกที่แท่งกราฟเพื่อดูรายละเอียด</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byBranchChart}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e) => {
                  const p = e?.activePayload?.[0]?.payload;
                  if (p) onDrillBranch(p.branchId);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={10} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dx={10} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#0f172a", fontWeight: 700 }} cursor={{ fill: "rgba(44,90,160,0.05)", rx: 6 }} />
                <Bar dataKey="score" fill="#2C5AA0" radius={[6, 6, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Score Progress Bars */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-navy dark:text-slate-100">คะแนนตามหมวดประเมิน</h3>
            <p className="text-xs text-slate-400 mt-0.5">เขียว ≥80% · เหลือง ≥60% · แดง &lt;60% (คลิกเพื่อดูข้อบกพร่อง)</p>
          </div>
          <SectionScorePanel
            sections={bySectionChart}
            onSelectSection={(name) => setSelectedSectionModalName(name)}
          />
        </div>
      </div>

      {/* ── Row 4: Branch Rankings ── */}
      <BranchRankingPanel
        topBranches={branchAverages.slice(0, 5)}
        bottomBranches={[...branchAverages].reverse().slice(0, 5)}
        onDrillBranch={onDrillBranch}
      />

      {/* ── Row 5: Employee Accountability ── */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-navy dark:text-slate-100">สรุปผลการปฏิบัติงานรายบุคคล</h2>
          <p className="text-xs text-slate-400 mt-0.5">คลิกที่รายชื่อเพื่อเปิดดูประวัติการถูกตรวจประเมินและคอมเมนต์รายหัวข้อ</p>
        </div>

        {employeeStats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-audit-hairline bg-white dark:bg-slate-800/50 p-8 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              <Users2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy dark:text-slate-100 mb-1">ยังไม่มีข้อมูลพนักงาน</div>
              <div className="text-xs text-slate-400">ข้อมูลจะแสดงหลังจากมีการตรวจประเมินและระบุผู้รับผิดชอบ</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Most Tagged */}
            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-navy dark:text-slate-100 mb-4">
                พนักงานที่ได้รับมอบหมาย (Tag) มากที่สุด
              </h3>
              <div className="space-y-1">
                {mostTagged.map((d, idx) => (
                  <button
                    key={d.employee.id}
                    onClick={() => setSelectedEmpModalId(d.employee.id)}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-xl bg-audit-tint dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-black text-audit-blue dark:text-blue-400">
                      {d.employee.firstName?.[0]}{d.employee.lastName?.[0]}
                    </div>
                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-navy dark:text-slate-100 truncate group-hover:text-audit-blue transition-colors">
                        {d.employee.firstName} {d.employee.lastName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{d.employee.role} · {branchName(d.employee.branchId)}</div>
                    </div>
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-black text-audit-blue bg-audit-tint dark:bg-blue-900/30 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                        {d.tagCount} ครั้ง
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Most Flagged */}
            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-navy dark:text-slate-100 mb-4">
                พนักงานที่มีข้อบกพร่องมากที่สุด
              </h3>
              <div className="space-y-1">
                {mostFlagged.map((d, idx) => (
                  <button
                    key={d.employee.id}
                    onClick={() => setSelectedEmpModalId(d.employee.id)}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0 text-xs font-black text-rose-600 dark:text-rose-400">
                      {d.employee.firstName?.[0]}{d.employee.lastName?.[0]}
                    </div>
                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-navy dark:text-slate-100 truncate group-hover:text-rose-600 transition-colors">
                        {d.employee.firstName} {d.employee.lastName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{d.employee.role} · {branchName(d.employee.branchId)}</div>
                    </div>
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-black text-rose-700 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                        {d.failCount} รายการ
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Employee Detail Modal ── */}
      {selectedEmpModal && (
        <EmployeeHistoryModal
          employee={selectedEmpModal}
          history={selectedEmpHistory}
          onClose={() => setSelectedEmpModalId(null)}
          onSelectEmployeeFullProfile={(empId) => onSelectEmployee(empId)}
        />
      )}

      {/* ── Section Defect Detail Modal ── */}
      {selectedSectionModalName && (
        <SectionDefectsModal
          sectionName={selectedSectionModalName}
          defects={selectedSectionHistory}
          onClose={() => setSelectedSectionModalName(null)}
          onSelectEmployee={(empId) => setSelectedEmpModalId(empId)}
        />
      )}
    </div>
  );
}
