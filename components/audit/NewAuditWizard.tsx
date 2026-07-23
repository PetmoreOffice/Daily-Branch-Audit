"use client";

import React, { useState } from "react";
import { Star, Camera, Search, Check, AlertCircle, MapPin, X } from "lucide-react";
import { BRANCHES, TEMPLATE, ALL_ITEMS, employeesAtBranchOnDate, statusFromScore, EMPLOYEES } from "@/lib/mock-data";
import { Audit, AuditItemResult, Employee } from "@/lib/types/audit";

interface NewAuditWizardProps {
  onSubmit: (audit: Audit) => void;
}

export default function NewAuditWizard({ onSubmit }: NewAuditWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [date, setDate] = useState<string>("2026-07-22");
  const [branchId, setBranchId] = useState<string>("");

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
      id: `A-NEW-${Date.now()}`,
      date,
      branchId,
      templateId: TEMPLATE.id,
      auditor: "คุณอารีย์ ตรวจงาน (Area Manager)",
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
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-navy">เริ่มการตรวจประเมินสาขาใหม่</h1>
          <p className="text-xs text-audit-slate">ระบุวันที่ สาขา และพิกัดสถานที่ก่อนทำแบบประเมิน</p>
        </div>

        <div className="gridgeist-card p-6 space-y-4">
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
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
            >
              <option value="">-- เลือกสาขา --</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.name} ({b.zone})
                </option>
              ))}
            </select>
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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
                    {/* Photo upload mock */}
                    {item.requirePhoto && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-audit-slate flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> แนบภาพถ่ายสภาพก่อนแก้ไข (Before)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              photosBefore: [...(ans.photosBefore || []), `photo_${Date.now()}.jpg`],
                            })
                          }
                          className="w-full py-2 border-2 border-dashed border-audit-blue/40 hover:border-audit-blue rounded-lg text-xs font-bold text-audit-blue bg-audit-tint/30 transition flex items-center justify-center gap-1.5"
                        >
                          + เพิ่มรูปถ่าย ({ans.photosBefore?.length || 0})
                        </button>
                      </div>
                    )}

                    {/* Responsible Staff Selection */}
                    {item.requireResponsible && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-audit-slate">
                          พนักงานที่รับผิดชอบ (ค้นหาชื่อ หรือพิมพ์เพิ่มได้)
                        </label>
                        <EmployeeSearch
                          selectedIds={ans.responsibleIds || []}
                          onChange={(ids) => updateItem(item.id, { responsibleIds: ids })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Note input for defects */}
                  {isDefect && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-status-bad mb-1">
                        ข้อเสนอแนะ / รายละเอียดที่ต้องแก้ไข:
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น สินค้าจัดวางไม่ตรงตามคู่มือ หรือ ความสะอาดไม่ได้มาตรฐาน"
                        value={ans.note || ""}
                        onChange={(e) => updateItem(item.id, { note: e.target.value })}
                        className="w-full bg-white border border-status-bad/40 rounded-lg px-3 py-1.5 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-status-bad"
                      />
                    </div>
                  )}
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

function EmployeeSearch({ selectedIds, onChange }: { selectedIds: string[], onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");

  // Map IDs back to objects/labels
  const getLabel = (id: string) => {
    const emp = EMPLOYEES.find((e) => e.id === id);
    if (emp) return `${emp.firstName} ${emp.lastName} (${emp.role})`;
    return id; // Free text fallback
  };

  const handleAdd = (val: string) => {
    if (!val.trim()) return;
    if (!selectedIds.includes(val)) {
      onChange([...selectedIds, val]);
    }
    setQuery("");
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  // Filter existing employees based on query
  const searchResults = query.length > 0 
    ? EMPLOYEES.filter(e => 
        (e.firstName + " " + e.lastName + " " + e.role).toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5) // Limit to 5 results
    : [];

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd(query);
            }
          }}
          placeholder="พิมพ์ชื่อ, นามสกุล, ตำแหน่ง หรือพิมพ์อิสระแล้วกด Enter"
          className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-audit-blue"
        />
        {query && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-audit-hairline shadow-lg rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleAdd(emp.id)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-audit-hairline last:border-0"
                >
                  <span className="font-bold text-audit-blue">{emp.firstName} {emp.lastName}</span>
                  <span className="text-audit-slate ml-2">({emp.role})</span>
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={() => handleAdd(query)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-audit-blue font-semibold"
              >
                + เพิ่ม "{query}" เป็นข้อมูลอิสระ (Free Text)
              </button>
            )}
          </div>
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
