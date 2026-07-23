"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  ClipboardCheck, CalendarDays, Star, TrendingUp, TrendingDown,
  FileWarning, AlertTriangle, ChevronRight, X
} from "lucide-react";
import KPICard from "./KPICard";
import { Audit, Branch, Employee, AuditItemResult } from "@/lib/types/audit";
import {
  BRANCHES, EMPLOYEES, TEMPLATE, avgScore, branchName,
  employeesAtBranchOnDate
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

  const months = useMemo(() => {
    const set = new Set(audits.map((a) => a.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [audits]);

  const filtered = monthFilter === "all" ? audits : audits.filter((a) => a.date.startsWith(monthFilter));

  const todayStr = "2026-07-22";
  const thisMonth = "2026-07";
  const todayCount = audits.filter((a) => a.date === todayStr).length;
  const monthCount = audits.filter((a) => a.date.startsWith(thisMonth)).length;

  const allItemScores = filtered.flatMap((a) => a.items);
  const overallAvg = avgScore(allItemScores);

  const branchAverages = BRANCHES.map((b) => {
    const items = filtered.filter((a) => a.branchId === b.id).flatMap((a) => a.items);
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard icon={ClipboardCheck} label="ตรวจวันนี้" value={todayCount} sub="22 ก.ค. 2569" accent="#2C5AA0" />
        <KPICard icon={CalendarDays} label="ตรวจเดือนนี้" value={monthCount} sub="ก.ค. 2569" accent="#5B8DEF" />
        <KPICard icon={Star} label="คะแนนเฉลี่ยรวม" value={overallAvg.toFixed(2) + " / 5"} accent="#12294B" />
        <KPICard icon={TrendingUp} label="สูงสุด" value={top ? top.branch.code : "-"} sub={top ? top.branch.name : ""} accent="#1E8E5A" />
        <KPICard icon={TrendingDown} label="ต่ำสุด" value={bottom ? bottom.branch.code : "-"} sub={bottom ? bottom.branch.name : ""} accent="#C23B3B" />
        <KPICard icon={FileWarning} label="หัวข้อไม่ผ่าน" value={failingItems} accent="#C77C00" />
        <KPICard icon={AlertTriangle} label="Action ค้าง" value={openActions} accent="#C23B3B" />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trend Line Chart */}
        <div className="lg:col-span-7 gridgeist-card p-4">
          <h3 className="text-sm font-bold text-navy mb-3">คะแนนเฉลี่ยรายเดือน</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid stroke="#E3E7ED" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2C5AA0" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Pie Chart */}
        <div className="lg:col-span-5 gridgeist-card p-4">
          <h3 className="text-sm font-bold text-navy mb-3">สัดส่วนข้อบกพร่องตามหมวดประเมิน</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={defectPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {defectPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Branch Performance Bar Chart */}
        <div className="lg:col-span-6 gridgeist-card p-4">
          <h3 className="text-sm font-bold text-navy mb-1">คะแนนเฉลี่ยแต่ละสาขา</h3>
          <p className="text-xs text-audit-slate mb-3">(คลิกที่แท่งกราฟเพื่อดูรายละเอียดรายสาขา)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byBranchChart}
                onClick={(e) => {
                  const p = e?.activePayload?.[0]?.payload;
                  if (p) onDrillBranch(p.branchId);
                }}
              >
                <CartesianGrid stroke="#E3E7ED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#2C5AA0" radius={[6, 6, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Score Horizontal Bar Chart */}
        <div className="lg:col-span-6 gridgeist-card p-4">
          <h3 className="text-sm font-bold text-navy mb-4">คะแนนเฉลี่ยตามหมวดประเมิน</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySectionChart} layout="vertical" margin={{ left: 15 }}>
                <CartesianGrid stroke="#E3E7ED" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#5B8DEF" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 10 */}
        <div className="gridgeist-card p-4">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-ok"></span>
            Top 10 สาขาคะแนนสูงสุด
          </h3>
          <div className="space-y-1">
            {branchAverages.slice(0, 10).map((d, idx) => (
              <button
                key={d.branch.id}
                onClick={() => onDrillBranch(d.branch.id)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-left text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-bold w-4 text-right">{idx + 1}</span>
                  <span className="font-semibold text-navy">{d.branch.name}</span>
                </div>
                <span className="font-extrabold text-status-ok text-sm">{d.avg.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom 10 */}
        <div className="gridgeist-card p-4">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-bad"></span>
            Bottom 10 สาขาคะแนนต่ำสุด
          </h3>
          <div className="space-y-1">
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
        <p className="text-xs text-audit-slate mb-4">คลิกที่รายชื่อเพื่อเรียกดูประวัติการตรวจและภาระงานที่ได้รับมอบหมาย</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Most Tagged Staff */}
          <div className="gridgeist-card p-4">
            <h3 className="text-sm font-bold text-navy mb-3">พนักงานที่ได้รับรับมอบหมาย (Tag) มากที่สุด</h3>
            <div className="space-y-1.5">
              {mostTagged.map((d, idx) => (
                <button
                  key={d.employee.id}
                  onClick={() => onSelectEmployee(d.employee.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-left text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-400 font-bold w-4 flex-shrink-0">{idx + 1}</span>
                    <div className="truncate">
                      <div className="font-bold text-navy truncate">
                        {d.employee.firstName} {d.employee.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {d.employee.role} · {branchName(d.employee.branchId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-500">เฉลี่ย {d.avg.toFixed(1)}</span>
                    <span className="font-extrabold text-audit-blue bg-audit-tint px-2 py-0.5 rounded-full text-xs">
                      {d.tagCount} ครั้ง
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Most Flagged Defect Staff */}
          <div className="gridgeist-card p-4">
            <h3 className="text-sm font-bold text-navy mb-3">พนักงานที่มีข้อบกพร่องมากที่สุด (Defects)</h3>
            <div className="space-y-1.5">
              {mostFlagged.map((d, idx) => (
                <button
                  key={d.employee.id}
                  onClick={() => onSelectEmployee(d.employee.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-left text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-400 font-bold w-4 flex-shrink-0">{idx + 1}</span>
                    <div className="truncate">
                      <div className="font-bold text-navy truncate">
                        {d.employee.firstName} {d.employee.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {d.employee.role} · {branchName(d.employee.branchId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-500">เฉลี่ย {d.avg.toFixed(1)}</span>
                    <span className="font-extrabold text-status-bad bg-status-badBg px-2 py-0.5 rounded-full text-xs">
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
    </div>
  );
}
