"use client";

import React, { useState, useRef } from "react";
import { Star, Camera, Search, Check, AlertCircle, MapPin, X } from "lucide-react";
import { BRANCHES, TEMPLATE, ALL_ITEMS, employeesAtBranchOnDate, statusFromScore, EMPLOYEES, formatAuditorName, getBranchHeadName, getAuditorCandidates } from "@/lib/mock-data";
import { Audit, AuditItemResult, Employee } from "@/lib/types/audit";

interface NewAuditWizardProps {
  onSubmit: (audit: Audit) => void;
  auditorName?: string;
}

export default function NewAuditWizard({ onSubmit, auditorName }: NewAuditWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState<string>("");
  const [auditorInput, setAuditorInput] = useState<string>(formatAuditorName(auditorName));
  const [isCustomAuditor, setIsCustomAuditor] = useState<boolean>(false);

  function handleBranchChange(selectedId: string) {
    setBranchId(selectedId);
    const headName = getBranchHeadName(selectedId);
    if (headName) {
      setAuditorInput(headName);
      setIsCustomAuditor(false);
    }
  }

  const [answers, setAnswers] = useState<Record<string, Partial<AuditItemResult>>>({});

  const branch = BRANCHES.find((b) => b.id === branchId);
  const branchEmployees = branchId ? employeesAtBranchOnDate(branchId, date) : [];

  function emptyAnswer(itemId: string): AuditItemResult {
    const def = ALL_ITEMS.find((i) => i.id === itemId);
    return {
      itemId,
      score: 0,
      note: "",
      photosBefore: [],
      photosAfter: [],
      responsibleIds: [],
      status: "ผ่าน",
    };
  }

  function updateItem(itemId: string, patch: Partial<AuditItemResult>) {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...emptyAnswer(itemId), ...prev[itemId], ...patch },
    }));
  }



  const allAnswered = ALL_ITEMS.every((it) => (answers[it.id]?.score || 0) > 0);

  function handleSubmit() {
    const items: AuditItemResult[] = ALL_ITEMS.map((it) => {
      const a = answers[it.id] || emptyAnswer(it.id);
      const score = a.score || 0;
      return {
        itemId: it.id,
        score,
        note: a.note || "",
        photosBefore: a.photosBefore || [],
        photosAfter: a.photosAfter || [],
        responsibleIds: a.responsibleIds || [],
        status: statusFromScore(score, it.maxScore),
      };
    });

    const newAudit: Audit = {
      id: `A-${Date.now()}`,
      date,
      branchId,
      templateId: TEMPLATE.id,
      auditor: auditorInput.trim() || formatAuditorName(auditorName),
      gps: "ไม่ระบุ",
      items,
    };

    onSubmit(newAudit);
    alert("บันทึกการตรวจประเมินสาขาเรียบร้อยแล้ว!");
    setStep(1);
    setBranchId("");
    setAnswers({});

  }

  if (step === 1) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">เริ่มการตรวจประเมินสาขาใหม่</h1>
          <p className="text-xs font-medium text-audit-slate">ระบุวันที่ สาขา และพิกัดสถานที่ก่อนทำแบบประเมิน</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-0 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-audit-blue flex items-center justify-center text-white text-xs font-black shrink-0">1</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-navy">ข้อมูลหลัก</div>
              <div className="text-[10px] text-audit-slate">วันที่ & สาขา</div>
            </div>
          </div>
          <div className="h-0.5 w-12 bg-audit-hairline mx-2 rounded-full" />
          <div className="flex items-center gap-2 flex-1 opacity-40">
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-black shrink-0">2</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-500">แบบประเมิน</div>
              <div className="text-[10px] text-slate-400">ให้คะแนนรายหัวข้อ</div>
            </div>
          </div>
        </div>

        <div className="gridgeist-card p-6 space-y-4 max-w-3xl">
          <div>
            <label className="block text-xs font-bold text-navy mb-1">วันที่ทำการตรวจประเมิน</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">เลือกร้านสาขาที่ทำการตรวจ</label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
            >
              <option value="">-- เลือกสาขา --</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">
              ชื่อผู้ตรวจประเมิน (เลือกจากหัวหน้าสาขา / ผู้จัดการสาขา)
            </label>
            <select
              value={isCustomAuditor ? "__CUSTOM__" : auditorInput}
              onChange={(e) => {
                if (e.target.value === "__CUSTOM__") {
                  setIsCustomAuditor(true);
                  setAuditorInput("");
                } else {
                  setIsCustomAuditor(false);
                  setAuditorInput(e.target.value);
                }
              }}
              className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
            >
              <option value="">-- เลือกผู้ตรวจประเมิน --</option>
              {branchId && (
                <optgroup label={`📌 หัวหน้าสาขา / ผู้จัดการสาขา (${branch?.name})`}>
                  {EMPLOYEES.filter(
                    (e) => e.branchId === branchId && (e.role === "หัวหน้าสาขา" || e.role === "ผู้จัดการสาขา")
                  ).map((e) => {
                    const val = `${e.firstName} ${e.lastName} (${e.role})`;
                    return (
                      <option key={e.id} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </optgroup>
              )}
              <optgroup label="📋 หัวหน้าสาขา / ผู้จัดการสาขา ทุกสาขา">
                {getAuditorCandidates().map((c) => {
                  const val = `${c.name} (${c.role})`;
                  return (
                    <option key={c.id} value={val}>
                      {c.displayName}
                    </option>
                  );
                })}
              </optgroup>
              <option value="__CUSTOM__">✏️ + ระบุชื่อผู้ตรวจท่านอื่น...</option>
            </select>

            {isCustomAuditor && (
              <input
                type="text"
                value={auditorInput}
                onChange={(e) => setAuditorInput(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล ผู้ตรวจประเมิน..."
                className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue mt-2"
              />
            )}
          </div>



          <div className="pt-4 border-t border-audit-hairline flex justify-end">
            <button
              disabled={!branchId}
              onClick={() => setStep(2)}
              className="bg-audit-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ถัดไป: เริ่มทำรายการประเมิน
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Step Header */}
      <div className="flex items-center justify-between bg-navy text-white p-4 rounded-xl shadow-md">
        <div>
          <div className="text-xs text-audit-sky font-semibold">{branch?.code}</div>
          <h2 className="text-lg font-bold">{branch?.name}</h2>
          <div className="text-xs text-slate-300">ประจำวันที่ {date}</div>
        </div>
        <button
          onClick={() => setStep(1)}
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg font-medium transition"
        >
          แก้ไขข้อมูลหลัก
        </button>
      </div>

      {/* Checklist Sections */}
      {TEMPLATE.sections.map((sec) => (
        <div key={sec.name} className="gridgeist-card p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-navy border-b border-audit-hairline pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-audit-blue"></span>
            หมวด: {sec.name}
          </h3>

          <div className="space-y-4">
            {sec.items.map((item) => {
              const ans = answers[item.id] || emptyAnswer(item.id);
              const score = ans.score || 0;
              const isDefect = score > 0 && score <= 3;

              return (
                <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-sm text-navy">{item.name}</div>
                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateItem(item.id, { score: st })}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              st <= score
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300 hover:text-amber-200"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-navy ml-2">{score} / 5</span>
                    </div>
                  </div>

                  {/* Photo & Tagging controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {/* Photo upload - available for ALL items */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-audit-slate flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-audit-blue" /> แนบรูปภาพประกอบ / ภาพถ่ายอ้างอิง
                      </label>
                      <label
                        className="w-full py-2 border-2 border-dashed border-audit-blue/40 hover:border-audit-blue rounded-lg text-xs font-bold text-audit-blue bg-audit-tint/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const urls = files.map((f) => URL.createObjectURL(f));
                            updateItem(item.id, {
                              photosBefore: [...(ans.photosBefore || []), ...urls],
                            });
                          }}
                        />
                        + แนบรูปถ่าย ({ans.photosBefore?.length || 0})
                      </label>
                      {/* Thumbnails */}
                      {(ans.photosBefore?.length || 0) > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-1.5 max-w-full shrink-0">
                          {ans.photosBefore!.map((url, i) => (
                            <div key={i} className="relative shrink-0">
                              <img src={url} alt={`photo-${i}`} className="w-14 h-14 object-cover rounded-lg border border-audit-hairline" />
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, {
                                  photosBefore: ans.photosBefore!.filter((_, j) => j !== i),
                                })}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center leading-none shadow-sm hover:bg-red-600 transition"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Responsible Staff Selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-audit-slate">
                        พนักงานที่รับผิดชอบ (ค้นหาชื่อ หรือพิมพ์เพิ่มได้)
                      </label>
                      <EmployeeSearch
                        branchId={branchId}
                        selectedIds={ans.responsibleIds || []}
                        onChange={(ids) => updateItem(item.id, { responsibleIds: ids })}
                      />
                    </div>
                  </div>

                  {/* Note / Reference Input - available for ALL items */}
                  <div className="pt-2">
                    <label className={`block text-xs font-bold mb-1 ${isDefect ? "text-status-bad" : "text-navy"}`}>
                      {isDefect ? "ข้อเสนอแนะ / รายละเอียดที่ต้องแก้ไข (อ้างอิง):" : "หมายเหตุ / รายละเอียดอ้างอิงเพิ่มเติม:"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isDefect
                          ? "เช่น สินค้าจัดวางไม่ตรงตามคู่มือ หรือ ความสะอาดไม่ได้มาตรฐาน"
                          : "ระบุหมายเหตุ ข้อเสนอแนะ หรือรายละเอียดอ้างอิงคู่มือ/เอกสาร (ถ้ามี)"
                      }
                      value={ans.note || ""}
                      onChange={(e) => updateItem(item.id, { note: e.target.value })}
                      className={`w-full bg-white border rounded-lg px-3 py-1.5 text-xs text-navy focus:outline-none focus:ring-1 ${
                        isDefect
                          ? "border-status-bad/40 focus:ring-status-bad"
                          : "border-audit-hairline focus:ring-audit-blue"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit Action Bar */}
      <div className="gridgeist-card p-4 flex items-center justify-between sticky bottom-4 shadow-xl border-t-2 border-audit-blue bg-white">
        <div className="text-xs font-semibold text-audit-slate">
          {allAnswered ? (
            <span className="text-status-ok font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> ทำการประเมินครบถ้วนแล้ว พร้อมส่งข้อมูล
            </span>
          ) : (
            <span className="text-status-warn font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> กรุณาประเมินให้ครบทุกหัวข้อก่อนส่ง
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-4 py-2 text-xs font-semibold border border-audit-hairline rounded-lg hover:bg-slate-50 text-navy"
          >
            ย้อนกลับ
          </button>
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className="bg-audit-blue text-white px-6 py-2 rounded-lg text-xs font-bold shadow hover:bg-navy disabled:opacity-50 transition"
          >
            บันทึกการตรวจประเมิน
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeeSearch({ selectedIds, onChange, branchId }: { selectedIds: string[], onChange: (ids: string[]) => void, branchId?: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const getLabel = (id: string) => {
    const emp = EMPLOYEES.find((e) => e.id === id);
    if (emp) return `${emp.firstName} ${emp.lastName} (${emp.role})`;
    return id;
  };

  const handleAdd = (val: string) => {
    if (!val.trim()) return;
    if (!selectedIds.includes(val)) {
      onChange([...selectedIds, val]);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const isWildcard = query.trim() === "*";

  // Candidates: Filter by query, wildcard *, or show current branch staff first
  const candidates = isWildcard
    ? EMPLOYEES
    : query.trim().length > 0
    ? EMPLOYEES.filter((e) =>
        `${e.firstName} ${e.lastName} ${e.nickname || ""} ${e.role} ${e.code}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : branchId
    ? EMPLOYEES.filter((e) => e.branchId === branchId)
    : EMPLOYEES;

  return (
    <div className="space-y-2 relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim() !== "*") {
                handleAdd(query);
              }
            }
          }}
          placeholder="คลิกเลือกชื่อพนักงานประจำสาขา, พิมพ์ * เพื่อดูพนักงานทั้งหมด หรือพิมพ์ค้นหาแล้วกด Enter"
          className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-audit-blue"
        />

        {/* Dropdown Suggestions */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 w-full mt-1 bg-white border border-audit-hairline shadow-xl rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-audit-hairline text-[10px] font-bold text-slate-400 uppercase flex justify-between items-center">
                <span>
                  {isWildcard
                    ? `รายชื่อพนักงานทั้งหมดในระบบ (${EMPLOYEES.length} คน)`
                    : query
                    ? `ผลการค้นหาพนักงาน (${candidates.length} คน)`
                    : "พนักงานประจำสาขานี้ (พิมพ์ * เพื่อดูทั้งหมด)"}
                </span>
              </div>
              {candidates.length > 0 ? (
                candidates.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  const bName = BRANCHES.find((b) => b.id === emp.branchId)?.name || emp.branchId;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleAdd(emp.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-audit-tint/50 border-b border-slate-100 last:border-0 transition ${
                        isSelected ? "bg-audit-tint font-bold text-audit-blue" : "text-navy"
                      }`}
                    >
                      <div>
                        <span className="font-bold">{emp.firstName} {emp.lastName}</span>
                        {emp.nickname && <span className="text-slate-400 ml-1">({emp.nickname})</span>}
                        <span className="text-slate-500 text-[11px] ml-2">· {emp.role}</span>
                        {(isWildcard || !branchId || emp.branchId !== branchId) && (
                          <span className="text-[10px] font-semibold text-audit-blue bg-audit-tint px-1.5 py-0.5 rounded ml-2">
                            {bName}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-audit-blue shrink-0" />}
                    </button>
                  );
                })
              ) : null}

              {query.trim() && !isWildcard && (
                <button
                  type="button"
                  onClick={() => handleAdd(query)}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-audit-tint text-audit-blue font-bold flex items-center gap-1 border-t border-slate-100"
                >
                  + เพิ่ม "{query}" เป็นข้อมูลอิสระ (Free Text)
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Selected Tags */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedIds.map(id => (
            <span key={id} className="inline-flex items-center gap-1 bg-audit-tint text-audit-blue text-[11px] font-bold px-2 py-1 rounded-md">
              {getLabel(id)}
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="text-audit-blue hover:text-navy focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
