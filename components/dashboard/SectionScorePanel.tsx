"use client";

import React from "react";

interface SectionScorePanelProps {
  sections: { name: string; score: number }[];
  onSelectSection?: (sectionName: string) => void;
}

function getScoreColor(score: number): { bar: string; text: string; bg: string } {
  const pct = (score / 5) * 100;
  if (pct >= 80) return { bar: "#1E8E5A", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (pct >= 60) return { bar: "#C77C00", text: "text-amber-700", bg: "bg-amber-50" };
  return { bar: "#C23B3B", text: "text-rose-700", bg: "bg-rose-50" };
}

function getScoreLabel(score: number): string {
  const pct = (score / 5) * 100;
  if (pct >= 80) return "ผ่าน";
  if (pct >= 60) return "ต้องปรับปรุง";
  return "ร้ายแรง";
}

/** Short label for each section — strips leading "N. " numbering */
function shortSectionName(name: string): string {
  return name.replace(/^\d+\.\s*/, "");
}

export default function SectionScorePanel({ sections, onSelectSection }: SectionScorePanelProps) {
  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400 text-xs">
        ยังไม่มีข้อมูล
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((sec, idx) => {
        const colors = getScoreColor(sec.score);
        const pct = Math.min(100, (sec.score / 5) * 100);
        const label = getScoreLabel(sec.score);

        return (
          <div
            key={idx}
            onClick={() => onSelectSection?.(sec.name)}
            className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
          >
            {/* Section Name + Badge */}
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-md text-white text-xs font-black flex items-center justify-center"
                  style={{ backgroundColor: colors.bar }}
                >
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={shortSectionName(sec.name)}>
                  {shortSectionName(sec.name)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-black text-navy dark:text-slate-100">
                  {sec.score > 0 ? sec.score.toFixed(2) : "–"}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.text} ${colors.bg}`}>
                  {label}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: colors.bar,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
