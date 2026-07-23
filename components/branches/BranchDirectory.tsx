"use client";

import React, { useState } from "react";
import { Store, MapPin, Users, Star, ChevronRight } from "lucide-react";
import { BRANCHES, ZONES, EMPLOYEES, SEED_AUDITS, avgScore } from "@/lib/mock-data";
import { Branch } from "@/lib/types/audit";

interface BranchDirectoryProps {
  onDrillBranch: (branchId: string) => void;
}

export default function BranchDirectory({ onDrillBranch }: BranchDirectoryProps) {
  const [selectedZone, setSelectedZone] = useState<string>("all");

  const filteredBranches = BRANCHES.filter((b) =>
    selectedZone === "all" ? true : b.zone === selectedZone
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">รายชื่อสาขาและเขตการปกครอง</h1>
          <p className="text-xs font-medium text-audit-slate">
            ข้อมูลเครือข่ายสาขาแยกตามเขตการบริหารงาน พร้อมสรุปคะแนนประเมินย้อนหลัง
          </p>
        </div>
        <div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-white border border-audit-hairline rounded-lg px-3 py-2 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
          >
            <option value="all">ทุกเขตการบริหาร</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => {
          const staffCount = EMPLOYEES.filter((e) => e.branchId === branch.id).length;
          const branchAudits = SEED_AUDITS.filter((a) => a.branchId === branch.id);
          const allItems = branchAudits.flatMap((a) => a.items);
          const score = avgScore(allItems);

          return (
            <div key={branch.id} className="gridgeist-card p-5 space-y-4 hover:border-audit-blue transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-audit-blue">{branch.code}</span>
                  <h3 className="text-base font-extrabold text-navy">{branch.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-audit-slate" /> {branch.province} ({branch.zone})
                  </div>
                </div>
                <span className="bg-status-okBg text-status-ok text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {branch.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-audit-hairline">
                <div className="bg-slate-50 p-2.5 rounded-xl text-center">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-audit-blue" /> พนักงานประจำ
                  </div>
                  <div className="text-lg font-extrabold text-navy mt-0.5">{staffCount} คน</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-center">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> คะแนนเฉลี่ย
                  </div>
                  <div className="text-lg font-extrabold text-audit-blue mt-0.5">
                    {score ? score.toFixed(2) : "-"} / 5
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDrillBranch(branch.id)}
                className="w-full flex items-center justify-center gap-1 bg-audit-tint text-audit-blue hover:bg-audit-blue hover:text-white py-2 rounded-xl text-xs font-bold transition"
              >
                ดูรายงานผลการประเมินสาขา <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
