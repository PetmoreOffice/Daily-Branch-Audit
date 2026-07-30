"use client";

import React, { useState, useMemo } from "react";
import { X, ChevronRight, AlertTriangle, CheckCircle2, User, Calendar, MapPin, Camera } from "lucide-react";
import { Employee, UserRole } from "@/lib/types/audit";
import { branchName, TEMPLATE, ALL_ITEMS } from "@/lib/mock-data";

export interface EmployeeHistoryItem {
  auditId: string;
  date: string;
  branchId: string;
  auditor: string;
  itemId: string;
  score: number;
  status: string;
  note: string;
  photosBefore?: string[];
  photosAfter?: string[];
}

interface EmployeeHistoryModalProps {
  employee: Employee;
  history: EmployeeHistoryItem[];
  onClose: () => void;
  onSelectEmployeeFullProfile?: (empId: string) => void;
}

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

export default function EmployeeHistoryModal({
  employee,
  history,
  onClose,
  onSelectEmployeeFullProfile,
}: EmployeeHistoryModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "defects">("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const defectsCount = useMemo(() => history.filter((h) => h.status !== "ผ่าน").length, [history]);
  const passCount = useMemo(() => history.filter((h) => h.status === "ผ่าน").length, [history]);

  const filteredHistory = useMemo(() => {
    if (filterTab === "defects") return history.filter((h) => h.status !== "ผ่าน");
    return history;
  }, [history, filterTab]);

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <span className="text-blue-300 font-bold text-lg">
                {employee.firstName?.[0] || ""}{employee.lastName?.[0] || ""}
              </span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-1 border border-blue-400/20">
                ประวัติผลการประเมินรายบุคคล
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {employee.firstName} {employee.lastName}
                {employee.nickname && <span className="text-slate-300 font-normal"> ({employee.nickname})</span>}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {employee.role} · {branchName(employee.branchId)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Filters Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200">
              ถูกระบุ: <strong className="text-blue-700 dark:text-blue-400 font-bold">{history.length} ครั้ง</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200">
              ข้อบกพร่อง: <strong className="text-rose-600 dark:text-rose-400 font-bold">{defectsCount} ครั้ง</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === "all"
                  ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ทั้งหมด ({history.length})
            </button>
            <button
              onClick={() => setFilterTab("defects")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === "defects"
                  ? "bg-white dark:bg-slate-600 text-rose-700 dark:text-rose-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ข้อบกพร่อง ({defectsCount})
            </button>
          </div>
        </div>

        {/* Modal Body: Timeline List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
              <span>
                {filterTab === "defects" ? "ไม่พบประวัติข้อบกพร่องของพนักงานท่านนี้" : "ยังไม่มีประวัติการประเมิน"}
              </span>
            </div>
          ) : (
            filteredHistory.map((h, idx) => {
              const details = getItemDetails(h.itemId);
              const isFail = h.status !== "ผ่าน";
              const [y, m, d] = h.date.split("-");
              const thDate = `${d}/${m}/${y}`;
              const allPhotos = [...(h.photosBefore || []), ...(h.photosAfter || [])];

              return (
                <div
                  key={`${h.auditId}-${h.itemId}-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isFail
                      ? "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60"
                      : "bg-white border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80 shadow-xs"
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between text-xs mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md font-bold">
                        📅 {thDate}
                      </span>
                      <span>{branchName(h.branchId)}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        isFail
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      คะแนน {h.score} / 5 ({h.status})
                    </span>
                  </div>

                  {/* Section & Item Name */}
                  <div className="mb-2.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {details.sectionName}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {details.itemTitle}
                    </div>
                  </div>

                  {/* Auditor Comment Box */}
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 border ${
                      isFail
                        ? "bg-rose-50/80 text-rose-950 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900"
                        : "bg-emerald-50/60 text-emerald-950 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900"
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{isFail ? "⚠️" : "💬"}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        ข้อคิดเห็นจากผู้ตรวจ ({h.auditor})
                      </div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {h.note || "ไม่มีคอมเมนต์เพิ่มเติม"}
                      </p>
                    </div>
                  </div>

                  {/* Photo Thumbnails if any */}
                  {allPhotos.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-1">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> รูปถ่าย:
                      </span>
                      {allPhotos.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setPreviewImage(img)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition truncate max-w-[120px]"
                        >
                          📷 {img}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            คลิกปุ่มขวามือเพื่อจัดการตำแหน่งพนักงาน
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold transition"
            >
              ปิดหน้าต่าง
            </button>
            {onSelectEmployeeFullProfile && (
              <button
                onClick={() => {
                  onClose();
                  onSelectEmployeeFullProfile(employee.id);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                ดูโปรไฟล์เต็ม <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl max-w-lg w-full text-center space-y-3">
            <div className="text-xs font-bold text-slate-500">รูปภาพประกอบ: {previewImage}</div>
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-sm font-semibold">
              📷 [ ตัวอย่างรูปถ่ายหลักฐาน ]
            </div>
            <button
              onClick={() => setPreviewImage(null)}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              ปิดรูปภาพ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
