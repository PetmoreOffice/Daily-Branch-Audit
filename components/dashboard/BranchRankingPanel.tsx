"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BranchRankingEntry {
  branch: { id: string; code: string; name: string };
  avg: number;
}

interface BranchRankingPanelProps {
  topBranches: BranchRankingEntry[];
  bottomBranches: BranchRankingEntry[];
  onDrillBranch: (branchId: string) => void;
}

function ScoreBar({ avg, maxAvg }: { avg: number; maxAvg: number }) {
  const pct = maxAvg > 0 ? (avg / 5) * 100 : 0;
  const color = avg >= 4 ? "#1E8E5A" : avg >= 3 ? "#2C5AA0" : avg >= 2.5 ? "#C77C00" : "#C23B3B";

  return (
    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RankList({
  entries,
  variant,
  onDrillBranch,
}: {
  entries: BranchRankingEntry[];
  variant: "top" | "bottom";
  onDrillBranch: (id: string) => void;
}) {
  const isTop = variant === "top";
  const maxAvg = Math.max(...entries.map((e) => e.avg), 1);

  return (
    <div className="space-y-1">
      {entries.slice(0, 5).map((d, idx) => {
        const scoreColor =
          d.avg >= 4
            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
            : d.avg >= 3
            ? "text-blue-600 bg-blue-50 border-blue-200"
            : d.avg >= 2.5
            ? "text-amber-600 bg-amber-50 border-amber-200"
            : "text-rose-600 bg-rose-50 border-rose-200";

        return (
          <button
            key={d.branch.id}
            onClick={() => onDrillBranch(d.branch.id)}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-150 group text-left"
          >
            {/* Rank number + name */}
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  idx === 0
                    ? isTop
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {idx + 1}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy dark:text-slate-100 truncate group-hover:text-audit-blue transition-colors">
                  {d.branch.name}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {d.branch.code}
                </div>
              </div>
            </div>

            {/* Score + Mini Bar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <ScoreBar avg={d.avg} maxAvg={maxAvg} />
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-lg border ${scoreColor}`}
              >
                {d.avg.toFixed(2)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function BranchRankingPanel({
  topBranches,
  bottomBranches,
  onDrillBranch,
}: BranchRankingPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Top Branches */}
      <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy dark:text-slate-100 leading-none">สาขาที่คะแนนสูงสุด</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">คลิกเพื่อดูรายละเอียด</p>
          </div>
        </div>
        {topBranches.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">ยังไม่มีข้อมูล</div>
        ) : (
          <RankList entries={topBranches} variant="top" onDrillBranch={onDrillBranch} />
        )}
      </div>

      {/* Bottom Branches */}
      <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy dark:text-slate-100 leading-none">สาขาที่ต้องพัฒนา</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">คลิกเพื่อดูรายละเอียด</p>
          </div>
        </div>
        {bottomBranches.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">ยังไม่มีข้อมูล</div>
        ) : (
          <RankList entries={bottomBranches} variant="bottom" onDrillBranch={onDrillBranch} />
        )}
      </div>
    </div>
  );
}
