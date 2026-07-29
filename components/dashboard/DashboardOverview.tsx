"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from "recharts";
import {
  ClipboardCheck, CalendarDays, Star, TrendingUp, TrendingDown,
  FileWarning, AlertTriangle, ChevronRight, X, LayoutDashboard,
  PlusCircle, BarChart3, Users2
} from "lucide-react";
import KPICard from "./KPICard";
import { Audit, Branch, Employee, AuditItemResult } from "@/lib/types/audit";
import {
  BRANCHES, EMPLOYEES, TEMPLATE, ALL_ITEMS, avgScore, branchName,
  employeesAtBranchOnDate, isSameBranch
} from "@/lib/mock-data";

interface DashboardOverviewProps {
  audits: Audit[];
  onDrillBranch: (branchId: string) => void;
  onSelectEmployee: (empId: string) => void;
}

export default function DashboardOverview({
  audits,
  onDrillBranch,
  onSelectEmployee,
}: DashboardOverviewProps) {
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayLabel = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const monthLabel = new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const months = useMemo(() => {
    const set = new Set(audits.map((a) => a.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [audits]);

  const filtered = monthFilter === "all" ? audits : audits.filter((a) => a.date.startsWith(monthFilter));

  const todayCount = audits.filter((a) => a.date === todayStr).length;
  const monthCount = audits.filter((a) => a.date.startsWith(thisMonth)).length;

  const allItemScores = filtered.flatMap((a) => a.items);
  const overallAvg = avgScore(allItemScores);

  const branchAverages = BRANCHES.map((b) => {
    const items = filtered.filter((a) => isSameBranch(a.branchId, b)).flatMap((a) => a.items);
    return { branch: b, avg: avgScore(items) };
  }).filter((x) => x.avg > 0);
  branchAverages.sort((a, b) => b.avg - a.avg);

  const top = branchAverages[0];
  const bottom = branchAverages[branchAverages.length - 1];

  const failingItems = allItemScores.filter((i) => i.status !== "ผ่าน").length;
  const openActions = allItemScores.filter((i) => i.status !== "ผ่าน" && i.photosAfter.length === 0).length;

  const monthlyTrend = months.map((m) => {
    const items = audits.filter((a) => a.date.startsWith(m)).flatMap((a) => a.items);
    return { month: m.slice(2), score: Number(avgScore(items).toFixed(2)) };
  });

  const byBranchChart = branchAverages.map((x) => ({
    name: x.branch.code,
    score: Number(x.avg.toFixed(2)),
    branchId: x.branch.id,
  }));

  const bySectionChart = TEMPLATE.sections.map((s) => {
    const ids = s.items.map((i) => i.id);
    const items = allItemScores.filter((i) => ids.includes(i.itemId));
    return { name: s.name, score: Number(avgScore(items).toFixed(2)) };
  });

  const defectPie = TEMPLATE.sections.map((s) => {
    const ids = s.items.map((i) => i.id);
    const count = allItemScores.filter((i) => ids.includes(i.itemId) && i.status !== "ผ่าน").length;
    return { name: s.name, value: count };
  }).filter((d) => d.value > 0);

  const PIE_COLORS = ["#2C5AA0", "#5B8DEF", "#8FB3E8", "#12294B", "#C77C00"];

  const employeeStats = EMPLOYEES.map((e) => {
    const related = filtered.flatMap((a) => a.items.filter((i) => i.responsibleIds.includes(e.id)));
    const failCount = related.filter((i) => i.status !== "ผ่าน").length;
    return {
      employee: e,
      tagCount: related.length,
      passCount: related.length - failCount,
      failCount,
      avg: avgScore(related),
    };
  }).filter((x) => x.tagCount > 0);

  const mostTagged = [...employeeStats].sort((a, b) => b.tagCount - a.tagCount).slice(0, 10);
  const mostFlagged = [...employeeStats]
    .filter((x) => x.failCount > 0)
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 10);

  const [selectedEmpModalId, setSelectedEmpModalId] = useState<string | null>(null);
  const [empFilterTab, setEmpFilterTab] = useState<"all" | "defects">("all");

  const selectedEmpModal = useMemo(() => {
    if (!selectedEmpModalId) return null;
    return EMPLOYEES.find((e) => e.id === selectedEmpModalId) || null;
  }, [selectedEmpModalId]);

  const selectedEmpHistory = useMemo(() => {
    if (!selectedEmpModalId) return [];
    const list: {
      auditId: string;
      date: string;
      branchId: string;
      auditor: string;
      itemId: string;
      score: number;
      status: string;
      note: string;
    }[] = [];

    filtered.forEach((a) => {
      a.items.forEach((i) => {
        if (i.responsibleIds.includes(selectedEmpModalId)) {
          list.push({
            auditId: a.id,
            date: a.date,
            branchId: a.branchId,
            auditor: a.auditor,
            itemId: i.itemId,
            score: i.score,
            status: i.status,
            note: i.note,
          });
        }
      });
    });

    list.sort((x, y) => y.date.localeCompare(x.date));
    return list;
  }, [filtered, selectedEmpModalId]);

  function getItemDetails(itemId: string) {
    if (!itemId) return { sectionName: "หมวดการประเมิน", itemTitle: "หัวข้อการประเมิน" };

    // 1. Try matching by mock ID in TEMPLATE.sections (e.g. "I01", "I04")
    for (const sec of TEMPLATE.sections) {
      const it = sec.items.find((x) => x.id === itemId);
      if (it) {
        return { sectionName: sec.name, itemTitle: it.name };
      }
    }

    // 2. Try matching by exact item name in TEMPLATE.sections
    for (const sec of TEMPLATE.sections) {
      const it = sec.items.find((x) => x.name === itemId);
      if (it) {
        return { sectionName: sec.name, itemTitle: it.name };
      }
    }

    // 3. Try matching against ALL_ITEMS (by id or name)
    const foundAll = ALL_ITEMS.find((x) => x.id === itemId || x.name === itemId);
    if (foundAll) {
      const sec = TEMPLATE.sections.find((s) => s.items.some((i) => i.id === foundAll.id));
      return { sectionName: sec?.name || foundAll.section || "หมวดการประเมิน", itemTitle: foundAll.name };
    }

    // 4. Try fuzzy matching: check if itemId is a substring or contains an item name
    for (const sec of TEMPLATE.sections) {
      const it = sec.items.find((x) => itemId.includes(x.id) || itemId.includes(x.name) || x.name.includes(itemId));
      if (it) {
        return { sectionName: sec.name, itemTitle: it.name };
      }
    }

    // 5. If itemId starts with a CUID/UUID (contains long alphanumeric hash without spaces), format cleanly
    if (/^[a-z0-9]{20,}$/i.test(itemId)) {
      return { sectionName: "หมวดการประเมินทั่วไป", itemTitle: "หัวข้อประเมินประจำสาขา" };
    }

    return { sectionName: "หมวดการประเมิน", itemTitle: itemId };
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Dashboard ภาพรวมการประเมิน</h1>
          <p className="text-xs font-medium text-audit-slate">วิเคราะห์ผลตรวจประเมินสาขาและประสิทธิภาพพนักงานแบบ Real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-audit-slate">เลือกช่วงเวลา:</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-white border border-audit-hairline rounded-lg text-xs font-semibold px-3 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
          >
            <option value="all">ทุกเดือน (6 เดือนล่าสุด)</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State Banner */}
      {audits.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-audit-hairline bg-white p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-audit-tint flex items-center justify-center">
            <LayoutDashboard className="w-8 h-8 text-audit-blue" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-navy mb-1">ยังไม่มีข้อมูลการประเมิน</h2>
            <p className="text-xs text-audit-slate leading-relaxed max-w-sm">
              เริ่มทำการตรวจประเมินสาขาเพื่อดูข้อมูลสถิติ กราฟ และ KPI แบบ Real-time ที่นี่
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-audit-slate px-3 py-2 bg-slate-50 rounded-lg border border-audit-hairline">
              <PlusCircle className="w-3.5 h-3.5 text-audit-blue" /> เริ่มตรวจประเมินสาขาใหม่
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-audit-slate px-3 py-2 bg-slate-50 rounded-lg border border-audit-hairline">
              <BarChart3 className="w-3.5 h-3.5 text-audit-blue" /> กราฟ &amp; Analytics จะแสดงที่นี่
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard icon={ClipboardCheck} label="ตรวจวันนี้" value={todayCount} sub={todayLabel} accent="#2C5AA0" />
        <KPICard icon={CalendarDays} label="ตรวจเดือนนี้" value={monthCount} sub={monthLabel} accent="#5B8DEF" />
        <KPICard icon={Star} label="คะแนนเฉลี่ยรวม" value={overallAvg.toFixed(2) + " / 5"} accent="#12294B" />
        <KPICard icon={TrendingUp} label="สูงสุด" value={top ? top.branch.code : "-"} sub={top ? top.branch.name : ""} accent="#1E8E5A" />
        <KPICard icon={TrendingDown} label="ต่ำสุด" value={bottom ? bottom.branch.code : "-"} sub={bottom ? bottom.branch.name : ""} accent="#C23B3B" />
        <KPICard icon={FileWarning} label="หัวข้อไม่ผ่าน" value={failingItems} accent="#C77C00" />
        <KPICard icon={AlertTriangle} label="Action ค้าง" value={openActions} accent="#C23B3B" />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend Line Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-audit-hairline shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-3">คะแนนเฉลี่ยรายเดือน</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={10} />
                <Tooltip
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", fontSize: "13px", color: "#0f172a", padding: "12px 16px" }}
                  itemStyle={{ color: "#0f172a", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: "#2563eb", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Pie Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-audit-hairline shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-3">สัดส่วนข้อบกพร่องตามหมวดประเมิน</h3>
          <div className="h-60">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={defectPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5} stroke="none" cornerRadius={4}>
                   {defectPie.map((_, i) => (
                     <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip
                   contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", fontSize: "13px", color: "#0f172a", padding: "12px 16px" }}
                   itemStyle={{ color: "#0f172a", fontWeight: 700 }}
                 />
                 <Legend wrapperStyle={{ fontSize: "12px", fill: "#64748b" }} iconType="circle" />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Branch Performance Bar Chart */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-audit-hairline shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-1">คะแนนเฉลี่ยแต่ละสาขา</h3>
          <p className="text-xs text-slate-400 mb-3">(คลิกที่แท่งกราฟเพื่อดูรายละเอียดรายสาขา)</p>
          <div className="h-64">
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
                 <Tooltip
                   cursor={{ fill: "rgba(37, 99, 235, 0.05)", rx: 6 }}
                   contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: "13px", color: "#0f172a", padding: "12px 16px" }}
                   itemStyle={{ color: "#0f172a", fontWeight: 700 }}
                 />
                 <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} cursor="pointer" />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Section Score Horizontal Bar Chart */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-audit-hairline shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-4">คะแนนเฉลี่ยตามหมวดประเมิน</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={bySectionChart} layout="vertical" margin={{ left: 15, right: 10, top: 10, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                 <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={5} />
                 <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dx={-10} />
                 <Tooltip
                   cursor={{ fill: "rgba(59, 130, 246, 0.05)", rx: 6 }}
                   contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: "13px", color: "#0f172a", padding: "12px 16px" }}
                   itemStyle={{ color: "#0f172a", fontWeight: 700 }}
                 />
                 <Bar dataKey="score" fill="#3b82f6" radius={[0, 6, 6, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top 10 */}
        <div className="bg-white p-5 rounded-xl border border-audit-hairline shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            สาขาที่คะแนนสูงสุด
          </h3>
          <div className="divide-y divide-slate-100">
            {branchAverages.slice(0, 10).map((d, idx) => (
              <button
                key={d.branch.id}
                onClick={() => onDrillBranch(d.branch.id)}
                className="w-full flex items-center justify-between py-2.5 hover:bg-slate-50 transition text-left text-xs rounded-lg px-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-semibold w-4 text-right">{idx + 1}</span>
                  <span className="font-bold text-navy">{d.branch.name}</span>
                </div>
                <span className="font-bold text-emerald-600 text-sm">{d.avg.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom 10 */}
        <div className="bg-white p-5 rounded-xl border border-audit-hairline shadow-sm">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            สาขาที่คะแนนต่ำสุด
          </h3>
          <div className="divide-y divide-audit-hairline">
            {[...branchAverages].reverse().slice(0, 10).map((d, idx) => (
              <button
                key={d.branch.id}
                onClick={() => onDrillBranch(d.branch.id)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-left text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-bold w-4 text-right">{idx + 1}</span>
                  <span className="font-semibold text-navy">{d.branch.name}</span>
                </div>
                <span className="font-extrabold text-status-bad text-sm">{d.avg.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Accountability Section */}
      <div>
        <h2 className="text-base font-extrabold text-navy mb-1">สรุปผลการปฏิบัติงานรายบุคคล</h2>
        <p className="text-xs text-audit-slate mb-4">คลิกที่รายชื่อเพื่อเปิดดูหน้าต่างประวัติการถูกคอมเมนต์ หัวข้อการประเมิน และคะแนนที่ได้รับแบบรายครั้ง</p>
        {employeeStats.length === 0 && (
          <div className="rounded-xl border border-dashed border-audit-hairline bg-white p-8 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <Users2 className="w-6 h-6 text-audit-slate" />
            </div>
            <div>
              <div className="text-sm font-bold text-navy mb-1">ยังไม่มีข้อมูลพนักงาน</div>
              <div className="text-xs text-audit-slate">ข้อมูลจะแสดงหลังจากมีการตรวจประเมินและระบุผู้รับผิดชอบแต่ละหัวข้อ</div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-audit-hairline bg-audit-hairline mt-4">
          {/* Most Tagged Staff */}
          <div className="bg-white p-5 border-b md:border-b-0 md:border-r border-audit-hairline">
            <h3 className="text-sm font-bold text-navy mb-3">พนักงานที่ได้รับรับมอบหมาย (Tag) มากที่สุด</h3>
            <div className="divide-y divide-audit-hairline">
              {mostTagged.map((d, idx) => (
                <button
                  key={d.employee.id}
                  onClick={() => setSelectedEmpModalId(d.employee.id)}
                  className="w-full flex items-center justify-between py-2.5 hover:bg-slate-50 transition text-left text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-400 font-bold w-4 flex-shrink-0">{idx + 1}</span>
                    <div className="truncate">
                      <div className="font-bold text-navy truncate">
                        {d.employee.firstName} {d.employee.lastName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {d.employee.role} · {branchName(d.employee.branchId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">เฉลี่ย {d.avg.toFixed(1)}</span>
                    <span className="font-mono font-extrabold text-audit-blue bg-audit-tint px-2 py-0.5 rounded-sm text-xs border border-audit-blue">
                      {d.tagCount} ครั้ง
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Most Flagged Defect Staff */}
          <div className="bg-white p-5">
            <h3 className="text-sm font-bold text-navy mb-3">พนักงานที่มีข้อบกพร่องมากที่สุด (Defects)</h3>
            <div className="divide-y divide-audit-hairline">
              {mostFlagged.map((d, idx) => (
                <button
                  key={d.employee.id}
                  onClick={() => setSelectedEmpModalId(d.employee.id)}
                  className="w-full flex items-center justify-between py-2.5 hover:bg-slate-50 transition text-left text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-400 font-bold w-4 flex-shrink-0">{idx + 1}</span>
                    <div className="truncate">
                      <div className="font-bold text-navy truncate">
                        {d.employee.firstName} {d.employee.lastName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {d.employee.role} · {branchName(d.employee.branchId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">เฉลี่ย {d.avg.toFixed(1)}</span>
                    <span className="font-mono font-extrabold text-status-bad bg-status-badBg px-2 py-0.5 rounded-sm text-xs border border-status-bad">
                      {d.failCount} ครั้ง
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Audit Feedback & Comments Modal */}
      {selectedEmpModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-emerald-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-lg">
                    {selectedEmpModal.firstName?.[0] || ""}{selectedEmpModal.lastName?.[0] || ""}
                  </span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-white/90 text-xs font-semibold mb-1">
                    ประวัติการถูกตรวจประเมินและข้อคิดเห็นรายหัวข้อ
                  </div>
                  <h2 className="text-base font-black text-white">
                    {selectedEmpModal.firstName} {selectedEmpModal.lastName}
                    {selectedEmpModal.nickname && <span className="text-white/80 font-normal"> ({selectedEmpModal.nickname})</span>}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    {selectedEmpModal.role} · {branchName(selectedEmpModal.branchId)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmpModalId(null)}
                className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-header Stats & Filter Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
                  ถูกระบุในแบบประเมิน: <strong className="text-emerald-700 font-bold">{selectedEmpHistory.length} ครั้ง</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
                  พบข้อบกพร่อง: <strong className="text-rose-600 font-bold">{selectedEmpHistory.filter((h) => h.status !== "ผ่าน").length} ครั้ง</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setEmpFilterTab("all")}
                  className={`px-3 py-1 rounded-md transition ${empFilterTab === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  ทั้งหมด ({selectedEmpHistory.length})
                </button>
                <button
                  onClick={() => setEmpFilterTab("defects")}
                  className={`px-3 py-1 rounded-md transition ${empFilterTab === "defects" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
                >
                  ข้อบกพร่อง ({selectedEmpHistory.filter((h) => h.status !== "ผ่าน").length})
                </button>
              </div>
            </div>

            {/* Modal Body: Comments & Items Timeline List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {selectedEmpHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  ยังไม่มีประวัติการระบุพนักงานในแบบประเมิน
                </div>
              ) : (
                selectedEmpHistory
                  .filter((h) => empFilterTab === "all" || h.status !== "ผ่าน")
                  .map((h, idx) => {
                    const details = getItemDetails(h.itemId);
                    const isFail = h.status !== "ผ่าน";
                    const [y, m, d] = h.date.split("-");
                    const thDate = `${d}/${m}/${y}`;
                    return (
                      <div
                        key={`${h.auditId}-${h.itemId}-${idx}`}
                        className={`p-4 rounded-xl border transition-all ${
                          isFail
                            ? "bg-rose-50/40 border-rose-200"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        {/* Entry Header */}
                        <div className="flex items-center justify-between text-xs mb-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2 font-semibold text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                              📅 {thDate}
                            </span>
                            <span>{branchName(h.branchId)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded font-extrabold text-xs ${
                                isFail ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              คะแนน {h.score} / 5 ({h.status})
                            </span>
                          </div>
                        </div>

                        {/* Assessment Section & Item Title */}
                        <div className="mb-2.5">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {details.sectionName}
                          </div>
                          <div className="text-sm font-bold text-navy">
                            {details.itemTitle}
                          </div>
                        </div>

                        {/* Comment / Note Box */}
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 border ${
                            isFail
                              ? "bg-rose-50 text-rose-950 border-rose-200 font-medium"
                              : "bg-emerald-50/70 text-emerald-950 border-emerald-200/60 font-medium"
                          }`}
                        >
                          <span className="text-base shrink-0 mt-0.5">{isFail ? "⚠️" : "💬"}</span>
                          <div className="flex-1">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                              ข้อคิดเห็น / คอมเมนต์จากผู้ตรวจ ({h.auditor})
                            </div>
                            <p className="font-bold text-xs">{h.note || "ไม่มีคอมเมนต์เพิ่มเติม"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                สามารถคลิกปุ่มขวามือเพื่อดูโปรไฟล์และจัดการตำแหน่งพนักงาน
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEmpModalId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  onClick={() => {
                    const empId = selectedEmpModalId;
                    setSelectedEmpModalId(null);
                    if (empId) onSelectEmployee(empId);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
                >
                  ดูโปรไฟล์เต็มและจัดการตำแหน่ง <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
