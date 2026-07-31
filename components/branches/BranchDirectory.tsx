import React, { useState, useEffect } from "react";
import { Store, MapPin, Users, Star, ChevronRight, Plus } from "lucide-react";
import { BRANCHES, ZONES, EMPLOYEES, avgScore, isSameBranch } from "@/lib/mock-data";
import { Audit, Branch } from "@/lib/types/audit";
import { getBranches, getEmployees } from "@/app/actions/employee";

interface BranchDirectoryProps {
  audits?: Audit[];
  onDrillBranch: (branchId: string) => void;
}

export default function BranchDirectory({ audits = [], onDrillBranch }: BranchDirectoryProps) {
  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [bList, eList] = await Promise.all([getBranches(), getEmployees()]);
        if (bList && bList.length > 0) setDbBranches(bList);
        if (eList && eList.length > 0) setDbEmployees(eList);
      } catch (err) {
        console.error("Error loading branches for directory:", err);
      }
    }
    loadData();
  }, []);

  const activeBranches = React.useMemo(() => {
    const list = dbBranches.length > 0 ? dbBranches : BRANCHES;
    return [...list].sort((a, b) => (a.code || "").localeCompare(b.code || "", undefined, { numeric: true }));
  }, [dbBranches]);

  const activeEmployees = dbEmployees.length > 0 ? dbEmployees : EMPLOYEES;

  return (
    <div className="px-2 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">รายชื่อสาขาและเขตการปกครอง</h1>
          <p className="text-xs font-medium text-audit-slate">
            ข้อมูลเครือข่ายสาขาแยกตามเขตการบริหารงาน พร้อมสรุปคะแนนประเมินย้อนหลัง
          </p>
        </div>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeBranches.map((branch) => {
          const staffCount = activeEmployees.filter((e) => isSameBranch(e.branchId, branch) || isSameBranch(e.currentBranchId, branch)).length;
          const branchAudits = audits.filter((a) => isSameBranch(a.branchId, branch));
          const allItems = branchAudits.flatMap((a) => a.items);
          const score = avgScore(allItems);
          const hasScore = score > 0;
          const scoreColor = !hasScore ? { bar: "#94a3b8", badge: "bg-slate-100 text-slate-500", label: "ยังไม่มีการตรวจ" }
            : score / 5 >= 0.8 ? { bar: "#1E8E5A", badge: "bg-status-okBg text-status-ok border border-emerald-200", label: "ผ่านเกณฑ์" }
            : score / 5 >= 0.6 ? { bar: "#C77C00", badge: "bg-status-warnBg text-status-warn border border-amber-200", label: "ต้องปรับปรุง" }
            : { bar: "#C23B3B", badge: "bg-status-badBg text-status-bad border border-red-200", label: "ร้ายแรง" };

          return (
            <div key={branch.id} className="bg-white p-5 rounded-xl border border-audit-hairline shadow-sm hover:shadow-md transition space-y-4 group">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-audit-blue">{branch.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${scoreColor.badge}`}>
                      {hasScore ? `${score.toFixed(2)} / 5` : "ยังไม่ตรวจ"}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-navy leading-tight">{branch.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-audit-slate shrink-0" /> {branch.province}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-status-okBg text-status-ok border border-emerald-200 shrink-0">
                  เปิดใช้งาน
                </span>
              </div>

              {/* Score progress bar */}
              {hasScore && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (score / 5) * 100)}%`, background: scoreColor.bar }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>คะแนนเฉลี่ย</span>
                    <span className="font-bold" style={{ color: scoreColor.bar }}>{scoreColor.label}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                  <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> พนักงานประจำ
                  </div>
                  <div className="text-sm font-extrabold text-navy mt-0.5">{staffCount} คน</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                  <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" /> ครั้งที่ตรวจ
                  </div>
                  <div className="text-sm font-extrabold text-navy mt-0.5">
                    {branchAudits.length} ครั้ง
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDrillBranch(branch.id)}
                className="w-full bg-slate-100 hover:bg-audit-blue hover:text-white text-navy font-bold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1 group-hover:bg-audit-blue group-hover:text-white"
              >
                ดูรายงานผลการประเมินสาขา <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
