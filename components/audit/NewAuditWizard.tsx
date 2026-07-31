import React, { useState, useRef, useEffect, useMemo } from "react";
import { Star, Camera, Search, Check, AlertCircle, MapPin, X, UserCheck, CheckCircle2, CalendarDays, FileText } from "lucide-react";
import { BRANCHES, TEMPLATE, ALL_ITEMS, employeesAtBranchOnDate, statusFromScore, EMPLOYEES, formatAuditorName, getBranchHeadName, getAuditorCandidates, formatDateDDMMYYYY } from "@/lib/mock-data";
import { Audit, AuditItemResult, Employee } from "@/lib/types/audit";
import { getEmployees, getBranches } from "@/app/actions/employee";
import { compressImageFile } from "@/lib/imageUtils";

interface NewAuditWizardProps {
  onSubmit: (audit: Audit) => void;
  auditorName?: string;
}

function DateInputDDMMYYYY({
  value,
  onChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
}) {
  const [textVal, setTextVal] = useState(() => {
    if (!value || !value.includes("-")) return value || "";
    const [y, m, d] = value.split("-");
    if (y && m && d && y.length === 4) {
      return `${d}/${m}/${y}`;
    }
    return value;
  });

  useEffect(() => {
    if (value && value.includes("-")) {
      const [y, m, d] = value.split("-");
      if (y && m && d && y.length === 4) {
        setTextVal(`${d}/${m}/${y}`);
      }
    } else {
      setTextVal(value || "");
    }
  }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^\d/]/g, "");
    if (!val.includes("/") && val.length > 2) {
      if (val.length <= 4) {
        val = `${val.slice(0, 2)}/${val.slice(2)}`;
      } else {
        val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
      }
    }
    setTextVal(val);

    const clean = val.replace(/[^\d/]/g, "");
    const parts = clean.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const numD = parseInt(d, 10);
        const numM = parseInt(m, 10);
        const numY = parseInt(y, 10);
        if (numD >= 1 && numD <= 31 && numM >= 1 && numM <= 12 && numY >= 2000 && numY <= 2100) {
          onChange(`${y}-${m}-${d}`);
        }
      }
    }
  }

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        placeholder="DD/MM/YYYY (เช่น 29/07/2026)"
        value={textVal}
        onChange={handleTextChange}
        maxLength={10}
        className="w-full bg-white border border-audit-hairline rounded-lg pl-3 pr-10 py-2 text-sm text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-audit-blue"
      />
      <div className="absolute right-2 top-1.5 flex items-center">
        <label
          title="เลือกจากปฏิทิน"
          className="p-1.5 hover:bg-slate-100 rounded-md cursor-pointer text-audit-slate hover:text-audit-blue transition relative flex items-center justify-center"
        >
          <CalendarDays className="w-4 h-4" />
          <input
            type="date"
            value={value}
            onChange={(e) => {
              if (e.target.value) {
                onChange(e.target.value);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  );
}

export default function NewAuditWizard({ onSubmit, auditorName }: NewAuditWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState<string>("");
  const [auditorInput, setAuditorInput] = useState<string>(formatAuditorName(auditorName));
  const [isCustomAuditor, setIsCustomAuditor] = useState<boolean>(false);

  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbBranches, setDbBranches] = useState<any[]>([]);

  useEffect(() => {
    async function loadRealData() {
      try {
        const [emps, branches] = await Promise.all([getEmployees(), getBranches()]);
        if (emps && emps.length > 0) setDbEmployees(emps);
        if (branches && branches.length > 0) setDbBranches(branches);
      } catch (err) {
        console.error("Error loading real data for wizard:", err);
      }
    }
    loadRealData();
  }, []);

  const activeBranches = dbBranches.length > 0 ? dbBranches : BRANCHES;

  const auditorCandidates = useMemo(() => {
    const source = dbEmployees.length > 0 ? dbEmployees : EMPLOYEES;
    const list = source
      .filter((e) => e.role === "หัวหน้าสาขา" || e.role === "ผู้จัดการสาขา" || e.role?.includes("ผู้จัดการ") || e.role?.includes("หัวหน้า"))
      .map((e) => {
        const bName = e.currentBranch?.name || e.branchName || "";
        return {
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          role: e.role,
          branchId: e.branchId || e.currentBranchId,
          branchName: bName,
          displayName: `${e.firstName} ${e.lastName} — ${e.role}${bName ? ` (${bName})` : ""}`,
        };
      });

    return list.sort((a, b) => {
      const isAManager = a.role.includes("ผู้จัดการ");
      const isBManager = b.role.includes("ผู้จัดการ");
      if (isAManager && !isBManager) return -1;
      if (!isAManager && isBManager) return 1;
      return a.name.localeCompare(b.name, "th");
    });
  }, [dbEmployees]);

  function handleBranchChange(selectedId: string) {
    setBranchId(selectedId);
    if (dbEmployees.length > 0) {
      const match = dbEmployees.find(
        (e) => (e.branchId === selectedId || e.currentBranchId === selectedId) && (e.role?.includes("ผู้จัดการ") || e.role === "หัวหน้าสาขา")
      );
      if (match) {
        setAuditorInput(`${match.firstName} ${match.lastName} (${match.role})`);
        setIsCustomAuditor(false);
        return;
      }
    }
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



  const allAnswered = ALL_ITEMS.every((it) => {
    if (it.id === "I20") return true;
    return answers[it.id]?.score !== undefined;
  });

  function handleSubmit() {
    if (!branchId) {
      alert("กรุณาเลือกสาขาก่อนบันทึกการประเมิน");
      return;
    }
    if (!date) {
      alert("กรุณาระบุวันที่ทำการตรวจประเมิน");
      return;
    }
    const items: AuditItemResult[] = ALL_ITEMS.map((it) => {
      const a = answers[it.id] || emptyAnswer(it.id);
      
      let score = a.score || 0;
      let status: "ผ่าน" | "ต้องปรับปรุง" | "ร้ายแรง" = statusFromScore(score, it.maxScore);

      // Special handling for I20 (6.1)
      if (it.id === "I20") {
        const hasProblem = a.reportText?.trim() || (a.photosBefore && a.photosBefore.length > 0);
        if (hasProblem) {
          score = 3;
          status = "ต้องปรับปรุง";
        } else {
          score = 5;
          status = "ผ่าน";
        }
      }

      return {
        itemId: it.id,
        score,
        note: a.note || "",
        reportText: a.reportText,
        startDate: a.startDate,
        completedDate: a.completedDate,
        isResolved: a.isResolved,
        photosBefore: a.photosBefore || [],
        photosAfter: a.photosAfter || [],
        responsibleIds: a.responsibleIds || [],
        status,
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
              <div className="text-xs text-audit-slate">วันที่ & สาขา</div>
            </div>
          </div>
          <div className="h-0.5 w-12 bg-audit-hairline mx-2 rounded-full" />
          <div className="flex items-center gap-2 flex-1 opacity-40">
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-black shrink-0">2</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-500">แบบประเมิน</div>
              <div className="text-xs text-slate-400">ให้คะแนนรายหัวข้อ</div>
            </div>
          </div>
        </div>

        <div className="gridgeist-card p-6 space-y-4 max-w-3xl">
          <div>
            <label className="block text-xs font-bold text-navy mb-1">วันที่ทำการตรวจประเมิน (DD/MM/YYYY)</label>
            <DateInputDDMMYYYY value={date} onChange={(newIso) => setDate(newIso)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">เลือกร้านสาขาที่ทำการตรวจ</label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full bg-white border border-audit-hairline rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
            >
              <option value="">-- เลือกสาขา --</option>
              {activeBranches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auditor Selector Dropdown */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-navy dark:text-slate-200 tracking-tight">
              ชื่อผู้ตรวจประเมิน (เลือกจากผู้จัดการสาขา / หัวหน้าสาขา)
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
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs font-semibold text-navy dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-audit-blue"
            >
              <option value="">-- เลือกจากรายชื่อผู้ตรวจประเมิน --</option>
              {auditorCandidates.map((c) => {
                const val = `${c.name} (${c.role})`;
                return (
                  <option key={c.id} value={val}>
                    {c.displayName}
                  </option>
                );
              })}
              <option value="__CUSTOM__">+ ระบุชื่อผู้ตรวจท่านอื่น...</option>
            </select>

            {/* Custom Auditor Input Field */}
            {isCustomAuditor && (
              <div className="mt-2 pt-1">
                <input
                  type="text"
                  value={auditorInput}
                  onChange={(e) => setAuditorInput(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล และตำแหน่งผู้ตรวจประเมิน..."
                  className="w-full bg-white dark:bg-slate-900 border border-audit-blue rounded-lg px-3.5 py-2.5 text-xs font-medium text-navy dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-audit-blue"
                  autoFocus
                />
              </div>
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
              const isDefect = answers[item.id]?.score !== undefined && score <= (item.minScore || 3);

              if (item.id === "I20" || item.id.startsWith("I2")) {
                return (
                  <div key={item.id} className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                    
                    <div className="p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed max-w-lg">
                            โปรดระบุรายละเอียดปัญหาที่พบจากการตรวจประเมิน และแนวทางแก้ไข พร้อมแนบภาพประกอบ 
                            หากสาขาอยู่ในเกณฑ์มาตรฐานและไม่มีข้อบกพร่องใดๆ สามารถเว้นว่างและข้ามหมวดหมู่นี้ได้ทันที
                          </p>
                        </div>
                        <div className="shrink-0 bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          <span className="hidden sm:inline">ไม่จำเป็นต้องกรอกหากไม่มีปัญหา (Optional)</span>
                          <span className="sm:hidden">ข้ามได้ (Optional)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              รายละเอียดปัญหา / ขั้นตอนแก้ไข
                            </label>
                            <textarea
                              rows={3}
                              placeholder="เช่น พื้นที่จัดเก็บสินค้าหลังร้านไม่เป็นระเบียบ ได้ทำการแจ้งพนักงานให้จัดเรียงใหม่..."
                              value={ans.reportText || ""}
                              onChange={(e) => updateItem(item.id, { reportText: e.target.value })}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none shadow-inner"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                วันที่เริ่มดำเนินการ
                              </label>
                              <input
                                type="date"
                                value={ans.startDate || date}
                                onChange={(e) => updateItem(item.id, { startDate: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                กำหนดเวลาแล้วเสร็จ
                              </label>
                              <input
                                type="date"
                                value={ans.completedDate || date}
                                onChange={(e) => updateItem(item.id, { completedDate: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            ภาพถ่ายอ้างอิง (Before & After)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Before Photo */}
                            <div className="space-y-2">
                              <label className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl text-xs font-bold text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                                <Camera className="w-5 h-5" />
                                <span className="text-center">แนบรูปปัญหา<br/>(Before: {ans.photosBefore?.length || 0})</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files || []);
                                    for (const file of files) {
                                      try {
                                        const base64 = await compressImageFile(file, 1000, 1000, 0.72);
                                        updateItem(item.id, {
                                          photosBefore: [...(ans.photosBefore || []), base64],
                                        });
                                      } catch (err) {
                                        console.error("Error compressing photo:", err);
                                      }
                                    }
                                  }}
                                />
                              </label>
                              {/* Thumbnails */}
                              {(ans.photosBefore?.length || 0) > 0 && (
                                <div className="flex gap-1.5 overflow-x-auto py-1 max-w-full shrink-0 snap-x">
                                  {ans.photosBefore!.map((url, i) => (
                                    <div key={i} className="relative shrink-0 snap-center">
                                      <img src={url} alt={`before-${i}`} className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm" />
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

                            {/* After Photo */}
                            <div className="space-y-2">
                              <label className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl text-xs font-bold text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                                <Camera className="w-5 h-5" />
                                <span className="text-center">แนบรูปแก้ไขแล้ว<br/>(After: {ans.photosAfter?.length || 0})</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files || []);
                                    for (const file of files) {
                                      try {
                                        const base64 = await compressImageFile(file, 1000, 1000, 0.72);
                                        updateItem(item.id, {
                                          photosAfter: [...(ans.photosAfter || []), base64],
                                        });
                                      } catch (err) {
                                        console.error("Error compressing photo:", err);
                                      }
                                    }
                                  }}
                                />
                              </label>
                              {/* Thumbnails */}
                              {(ans.photosAfter?.length || 0) > 0 && (
                                <div className="flex gap-1.5 overflow-x-auto py-1 max-w-full shrink-0 snap-x">
                                  {ans.photosAfter!.map((url, i) => (
                                    <div key={i} className="relative shrink-0 snap-center">
                                      <img src={url} alt={`after-${i}`} className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                      <button
                                        type="button"
                                        onClick={() => updateItem(item.id, {
                                          photosAfter: ans.photosAfter!.filter((_, j) => j !== i),
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
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { isResolved: !ans.isResolved })}
                          className={`px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center w-full gap-2 shadow-sm ${
                            ans.isResolved
                              ? "bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-1"
                              : "bg-slate-800 text-white hover:bg-emerald-600 hover:shadow-md"
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          {ans.isResolved ? "ยืนยันการแก้ไขเสร็จสมบูรณ์" : "ทำเครื่องหมายว่าแก้ไขแล้ว"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal Item Render
              return (
                <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-sm text-navy">{item.name}</div>
                    {/* Star Rating */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { score: 0 })}
                        title="ให้ 0 คะแนน (ไม่ผ่านเลย)"
                        className={`px-2 py-0.5 rounded-md text-xs font-bold transition border ${
                          ans.score === 0 && answers[item.id]?.score !== undefined
                            ? "bg-status-bad text-white border-status-bad shadow-sm"
                            : "bg-white text-slate-500 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        0 คะแนน
                      </button>
                      {Array.from({ length: item.maxScore || 5 }, (_, i) => i + 1).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              score: answers[item.id]?.score === st ? 0 : st,
                            })
                          }
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              st <= score && answers[item.id]?.score !== undefined
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300 hover:text-amber-200"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-navy ml-2">
                        {answers[item.id]?.score !== undefined ? `${score} / ${item.maxScore || 5}` : "ยังไม่ให้คะแนน"}
                      </span>
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
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            for (const file of files) {
                              try {
                                const base64 = await compressImageFile(file, 1000, 1000, 0.72);
                                updateItem(item.id, {
                                  photosBefore: [...(ans.photosBefore || []), base64],
                                });
                              } catch (err) {
                                console.error("Error compressing photo:", err);
                              }
                            }
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
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none shadow-sm hover:bg-red-600 transition"
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

                  {/* Note / Reference Input */}
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
              <div className="px-3 py-1.5 bg-slate-50 border-b border-audit-hairline text-xs font-bold text-slate-400 uppercase flex justify-between items-center">
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
                        <span className="text-slate-500 text-xs ml-2">· {emp.role}</span>
                        {(isWildcard || !branchId || emp.branchId !== branchId) && (
                          <span className="text-xs font-semibold text-audit-blue bg-audit-tint px-1.5 py-0.5 rounded ml-2">
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
            <span key={id} className="inline-flex items-center gap-1 bg-audit-tint text-audit-blue text-xs font-bold px-2 py-1 rounded-md">
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
