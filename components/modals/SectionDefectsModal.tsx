"use client";

import React, { useState, useMemo } from "react";
import { X, AlertTriangle, CheckCircle2, User, Camera, Filter } from "lucide-react";
import { EMPLOYEES, TEMPLATE, ALL_ITEMS, branchName } from "@/lib/mock-data";

export interface SectionDefectItem {
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
}

interface SectionDefectsModalProps {
  sectionName: string;
  defects: SectionDefectItem[];
  onClose: () => void;
  onSelectEmployee?: (empId: string) => void;
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

export default function SectionDefectsModal({
  sectionName,
  defects,
  onClose,
  onSelectEmployee,
}: SectionDefectsModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "critical" | "pending">("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const criticalCount = useMemo(() => defects.filter((d) => d.status === "ร้ายแรง").length, [defects]);
  const pendingCount = useMemo(() => defects.filter((d) => d.photosAfter.length === 0).length, [defects]);

  const filteredDefects = useMemo(() => {
    if (filterTab === "critical") return defects.filter((d) => d.status === "ร้ายแรง");
    if (filterTab === "pending") return defects.filter((d) => d.photosAfter.length === 0);
    return defects;
  }, [defects, filterTab]);

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-1 border border-blue-400/20">
              รายละเอียดข้อบกพร่องตามหมวดประเมิน
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {sectionName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Filter Tabs */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span>พบข้อบกพร่องรวม:</span>
            <strong className="text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              {defects.length} รายการ
            </strong>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === "all"
                  ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ทั้งหมด ({defects.length})
            </button>
            <button
              onClick={() => setFilterTab("critical")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === "critical"
                  ? "bg-white dark:bg-slate-600 text-rose-700 dark:text-rose-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ร้ายแรง ({criticalCount})
            </button>
            <button
              onClick={() => setFilterTab("pending")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === "pending"
                  ? "bg-white dark:bg-slate-600 text-amber-700 dark:text-amber-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ค้างแก้ไข ({pendingCount})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredDefects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
              <span>ไม่พบรายการข้อบกพร่องในเงื่อนไขที่เลือก</span>
            </div>
          ) : (
            filteredDefects.map((h, idx) => {
              const details = getItemDetails(h.itemId);
              const [y, m, d] = h.date.split("-");
              const thDate = `${d}/${m}/${y}`;
              const isCritical = h.status === "ร้ายแรง";
              const allPhotos = [...(h.photosBefore || []), ...(h.photosAfter || [])];

              return (
                <div
                  key={`${h.auditId}-${h.itemId}-${idx}`}
                  className="p-4 rounded-xl border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
                >
                  {/* Top Bar: Date, Branch, Score */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md font-bold">
                        📅 {thDate}
                      </span>
                      <span>{branchName(h.branchId)}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        isCritical
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      คะแนน {h.score} / 5 ({h.status})
                    </span>
                  </div>

                  {/* Item Title */}
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {details.itemTitle}
                  </div>

                  {/* Responsible Staff Pills */}
                  {h.responsibleIds.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-slate-400 font-medium">ผู้รับผิดชอบ:</span>
                      {h.responsibleIds.map((empId) => {
                        const emp = EMPLOYEES.find((e) => e.id === empId);
                        if (!emp) return null;
                        return (
                          <button
                            key={empId}
                            onClick={() => {
                              if (onSelectEmployee) {
                                onClose();
                                onSelectEmployee(empId);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition border border-blue-200/60 dark:border-blue-800"
                          >
                            <User className="w-3 h-3" />
                            {emp.firstName} {emp.lastName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Auditor Comment Box */}
                  <div className="p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <div className="text-xs font-bold text-slate-400 mb-0.5">
                      ข้อคิดเห็นจากผู้ตรวจ ({h.auditor})
                    </div>
                    <p className="font-semibold">{h.note || "ไม่มีคอมเมนต์เพิ่มเติม"}</p>
                  </div>

                  {/* Photos */}
                  {allPhotos.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-1">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> รูปถ่ายหลักฐาน:
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

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            คลิกที่ชื่อผู้รับผิดชอบเพื่อเปิดดูโปรไฟล์พนักงาน
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold transition ml-auto"
          >
            ปิดหน้าต่าง
          </button>
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
