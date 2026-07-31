"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench, AlertTriangle, CheckCircle2, Clock, Search, BookOpen,
  Camera, User, Building2, Calendar, Check, X, ShieldAlert,
  FileCheck2, ArrowRight
} from "lucide-react";
import { Audit } from "@/lib/types/audit";
import { BRANCHES, EMPLOYEES, TEMPLATE, ALL_ITEMS, branchName } from "@/lib/mock-data";

interface ActionItemsTrackerProps {
  audits: Audit[];
}

/** Standard Operating Procedure (SOP) Resolution Guidelines by itemId */
const RESOLUTION_GUIDELINES: Record<string, { guide: string; category: string; priority: "สูง" | "ปานกลาง" | "ปกติ" }> = {
  I01: {
    category: "1. การเตรียมความพร้อมก่อนเปิดร้าน",
    guide: "ผู้จัดการสาขาปฏิบัติตามขั้นตอนตักเตือนพนักงานกะเช้า และปรับเปลี่ยนเวลาเดินทางถึงร้านล่วงหน้าอย่างน้อย 15 นาที หากเกิดเหตุจำเป็นให้แจ้ง Area Manager ทันที",
    priority: "สูง",
  },
  I02: {
    category: "1. การเตรียมความพร้อมก่อนเปิดร้าน",
    guide: "ตรวจนับเงินทอนประจำกะก่อนเปิดร้าน เช็คความพร้อมของแคชเชียร์และสินค้าหน้าเชลฟ์ หากเงินทอนไม่พอให้เบิกสำรองล่วงหน้า 1 วัน",
    priority: "สูง",
  },
  I03: {
    category: "1. การเตรียมความพร้อมก่อนเปิดร้าน",
    guide: "ตรวจสอบความพร้อมของไฟส่องสว่าง เครื่อง POS และระบบปรับอากาศ หากชำรุดให้เปิด Ticket แจ้งฝ่าย IT/ช่างอาคารทันที",
    priority: "ปกติ",
  },
  I04: {
    category: "2. การบริการ",
    guide: "กำชับพนักงานให้ปฏิบัติตามมาตรฐานการทักทาย 4 ขั้นตอน (ยิ้ม ทัก กล่าวขอบคุณ) โดยให้หัวหน้าสาขาสุ่มตรวจกล้องวงจรปิดวันละ 2 ครั้ง",
    priority: "ปกติ",
  },
  I05: {
    category: "2. การบริการ",
    guide: "พนักงานต้องสอบถามเบอร์สมาชิกและชื่อสัตว์เลี้ยงของลูกค้าทุกครั้ง เพื่อสะสมแต้มและบันทึกประวัติการซื้อในระบบ CRM",
    priority: "ปกติ",
  },
  I06: {
    category: "2. การบริการ",
    guide: "ทบทวนโปรโมชั่นประจำเดือนในการประชุม Brief ประจำวัน (Morning Talk) เพื่อให้พนักงานแนะนำสินค้าได้อย่างแม่นยำ",
    priority: "ปกติ",
  },
  I07: {
    category: "2. การบริการ",
    guide: "ทวนยอดเงินรับ และยอดเงินทอนให้ลูกค้าฟังอย่างชัดเจนทุกครั้ง พร้อมส่งมอบใบเสร็จรับเงิน",
    priority: "ปกติ",
  },
  I08: {
    category: "2. การบริการ",
    guide: "ทวนรายการสินค้าในถุงร่วมกับลูกค้าก่อนส่งมอบ และช่วยอำนวยความสะดวกนำส่งสินค้าที่รถในกรณีลูกค้ายอดซื้อใหญ่/หนัก",
    priority: "ปกติ",
  },
  I09: {
    category: "2. การบริการ",
    guide: "จัดทำอบรมมารยาทและการสื่อสารกับลูกค้าเพิ่มเติมประจำสาขา",
    priority: "ปกติ",
  },
  I10: {
    category: "3. การดูแลสินค้าหน้าร้าน",
    guide: "ดำเนินการจัดสินค้าแบบ FIFO (First-In, First-Out) สินค้าหมดอายุ/ใกล้หมดอายุภายใน 3 เดือน ให้ดำเนินการดึงออกและแจ้งลงแอปพลิเคชันคลังสินค้าเพื่อตัดจ่าย/คีย์ส่วนลดทันที",
    priority: "สูง",
  },
  I11: {
    category: "3. การดูแลสินค้าหน้าร้าน",
    guide: "ตรวจสอบป้ายราคาหลักและป้ายสื่อโปรโมชั่นกับระบบ POS ให้ตรงกัน 100% หากพบป้ายผิดหรือชำรุดให้พิมพ์เปลี่ยนใหม่ทันที",
    priority: "สูง",
  },
  I12: {
    category: "3. การดูแลสินค้าหน้าร้าน",
    guide: "ตรวจนับสินค้าควบคุม (กลุ่มยา) ประจำสัปดาห์ เติมสินค้า Top 1-50 บนเชลฟ์อย่าให้ขาด ห้ามจัดวางสินค้าต่าง SKU ปะปนกัน",
    priority: "สูง",
  },
  I13: {
    category: "3. การดูแลสินค้าหน้าร้าน",
    guide: "จัดทำสต็อกการ์ด และจัดเรียงสินค้าบนชั้นให้เป็นระเบียบเรียบร้อย",
    priority: "ปกติ",
  },
  I14: {
    category: "4. ความสะอาด",
    guide: "ดำเนินการเช็ดทำความสะอาดฝุ่นบนตัวสินค้า เชลฟ์วางสินค้า และพื้นที่หน้าร้านตามตาราง 5ส ประจำวัน ถ่ายรูปยืนยันส่งกลุ่มไลน์สาขา",
    priority: "ปานกลาง",
  },
  I15: {
    category: "4. ความสะอาด",
    guide: "ทำความสะอาดห้องน้ำและพื้นที่หลังร้าน เก็บขยะหน้าร้านใส่ถังขยะมิดชิด",
    priority: "ปานกลาง",
  },
  I16: {
    category: "5. อื่นๆ",
    guide: "ผู้จัดการสาขาต้องตรวจสอบ Daily Checklist ประจำวันและลงลายมือชื่อกำกับก่อนเวลา 10:00 น. ทุกวัน",
    priority: "ปานกลาง",
  },
  I17: {
    category: "5. อื่นๆ",
    guide: "กรณีมีข้อร้องเรียนจากลูกค้า ให้ผู้จัดการสาขาโทรติดต่อลูกค้าเพื่อรับฟังและขอโทษภายใน 24 ชม. พร้อมบันทึกรายงานส่ง AM",
    priority: "สูง",
  },
  I18: {
    category: "5. อื่นๆ",
    guide: "ประสานงานฝ่ายสนับสนุนคลังสินค้าหรือฝ่ายที่เกี่ยวข้องอย่างตรงไปตรงมา บันทึกหลักฐานเอกสารครบถ้วน",
    priority: "ปกติ",
  },
  I19: {
    category: "5. อื่นๆ",
    guide: "ปฏิบัติตามนโยบายและข้อบังคับของบริษัทอย่างเคร่งครัด",
    priority: "ปกติ",
  },
};

function getGuideForItem(itemId: string, itemName: string) {
  if (RESOLUTION_GUIDELINES[itemId]) return RESOLUTION_GUIDELINES[itemId];
  const lower = itemName.toLowerCase();
  if (lower.includes("fifo") || lower.includes("exp")) return RESOLUTION_GUIDELINES["I10"];
  if (lower.includes("ป้ายราคา")) return RESOLUTION_GUIDELINES["I11"];
  if (lower.includes("เปิดปิด") || lower.includes("ประตู")) return RESOLUTION_GUIDELINES["I01"];
  if (lower.includes("ฝุ่น") || lower.includes("ความสะอาด")) return RESOLUTION_GUIDELINES["I14"];
  if (lower.includes("ร้องเรียน")) return RESOLUTION_GUIDELINES["I17"];

  return {
    category: "การประเมินมาตรฐาน",
    guide: "ปฏิบัติตามมาตรฐานคู่มือการปฏิบัติงานสาขา ดำเนินการปรับปรุงแก้ไขข้อบกพร่องและถ่ายภาพยืนยันการแก้ไขส่งผู้ตรวจประเมิน",
    priority: "ปานกลาง" as const,
  };
}

export default function ActionItemsTracker({ audits }: ActionItemsTrackerProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "resolved">("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [resolvingItem, setResolvingItem] = useState<{ auditId: string; itemId: string; title: string } | null>(null);
  const [resolveNote, setResolveNote] = useState<string>("");
  const [resolvePhoto, setResolvePhoto] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Flatten all reported problems from Section 6.1 (I20)
  const allDefects = useMemo(() => {
    const list: {
      auditId: string;
      date: string;
      branchId: string;
      auditor: string;
      itemId: string;
      score: number;
      status: string;
      note: string;
      reportText: string;
      startDate: string;
      completedDate: string;
      isResolved: boolean;
      responsibleIds: string[];
      photosBefore: string[];
      photosAfter: string[];
    }[] = [];

    audits.forEach((a) => {
      a.items.forEach((i) => {
        // Track ONLY problems from Item 6.1 (I20)
        if (i.itemId === "I20" && i.status !== "ผ่าน") {
          list.push({
            auditId: a.id,
            date: a.date,
            branchId: a.branchId,
            auditor: a.auditor,
            itemId: i.itemId,
            score: i.score,
            status: i.status,
            note: i.note || "",
            reportText: i.reportText || "",
            startDate: i.startDate || "",
            completedDate: i.completedDate || "",
            isResolved: i.isResolved || false,
            responsibleIds: i.responsibleIds || [],
            photosBefore: i.photosBefore || [],
            photosAfter: i.photosAfter || [],
          });
        }
      });
    });

    return list.sort((x, y) => y.date.localeCompare(x.date));
  }, [audits]);

  // Filtered defects list
  const filteredDefects = useMemo(() => {
    return allDefects.filter((d) => {
      if (selectedBranch !== "all" && d.branchId !== selectedBranch) return false;

      const isResolved = d.photosAfter.length > 0;
      if (selectedStatus === "pending" && isResolved) return false;
      if (selectedStatus === "resolved" && !isResolved) return false;

      if (selectedSection !== "all") {
        const sec = TEMPLATE.sections.find((s) => s.name === selectedSection);
        if (sec) {
          const secItemIds = sec.items.map((it) => it.id);
          if (!secItemIds.includes(d.itemId)) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bName = branchName(d.branchId).toLowerCase();
        const it = ALL_ITEMS.find((x) => x.id === d.itemId || x.name === d.itemId);
        const title = (it ? it.name : d.itemId).toLowerCase();
        const note = d.note.toLowerCase();
        if (!bName.includes(q) && !title.includes(q) && !note.includes(q)) return false;
      }

      return true;
    });
  }, [allDefects, selectedBranch, selectedSection, selectedStatus, searchQuery]);

  const pendingCount = useMemo(() => allDefects.filter((d) => d.photosAfter.length === 0).length, [allDefects]);
  const resolvedCount = useMemo(() => allDefects.filter((d) => d.photosAfter.length > 0).length, [allDefects]);
  const criticalCount = useMemo(() => allDefects.filter((d) => d.status === "ร้ายแรง").length, [allDefects]);

  function getItemTitle(itemId: string) {
    const it = ALL_ITEMS.find((x) => x.id === itemId || x.name === itemId);
    if (it) return it.name;
    for (const sec of TEMPLATE.sections) {
      const found = sec.items.find((x) => x.id === itemId || x.name === itemId);
      if (found) return found.name;
    }
    return itemId;
  }

  function handleMarkResolved(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvingItem) return;
    const targetDefect = allDefects.find((d) => d.auditId === resolvingItem.auditId && d.itemId === resolvingItem.itemId);
    if (targetDefect) {
      targetDefect.photosAfter = [resolvePhoto.trim() || `resolved_${Date.now()}.jpg`];
      if (resolveNote.trim()) {
        targetDefect.note += ` (แก้ไขแล้ว: ${resolveNote.trim()})`;
      }
    }
    setResolvingItem(null);
    setResolveNote("");
    setResolvePhoto("");
  }

  return (
    <div className="px-2 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold mb-1 border border-blue-500/20">
            <Wrench className="w-3.5 h-3.5" /> ระบบติดตามและแก้ไขข้อบกพร่อง (Action Items & CAPA)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy dark:text-slate-100 tracking-tight">
            ติดตามการแก้ไขปัญหา &amp; แนวทางปฏิบัติมาตรฐาน
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            รวบรวมรายการข้อบกพร่องที่ตรวจพบ คู่มือขั้นตอนแก้ไขมาตรฐาน SOP และการอัปเดตหลักฐานยืนยัน
          </p>
        </div>
      </div>

      {/* ── KPI Cards (Left Accent Border Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Actions Card */}
        <div
          onClick={() => setSelectedStatus("pending")}
          className={`gridgeist-card p-5 relative overflow-hidden transition-all duration-200 cursor-pointer ${
            selectedStatus === "pending" ? "ring-2 ring-amber-500/50 shadow-md" : "hover:shadow-md"
          }`}
          style={{ borderLeft: "4px solid #C77C00" }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ค้างแก้ไข (Action Pending)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-navy dark:text-slate-100 tracking-tight">
            {pendingCount} <span className="text-xs font-semibold text-slate-400">รายการ</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">ยังไม่มีรูปถ่ายหลักฐานยืนยันหลังปรับปรุง</p>
        </div>

        {/* Critical Defects Card */}
        <div
          onClick={() => setSelectedStatus("all")}
          className="gridgeist-card p-5 relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md"
          style={{ borderLeft: "4px solid #C23B3B" }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ข้อบกพร่องร้ายแรง (Critical)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-navy dark:text-slate-100 tracking-tight">
            {criticalCount} <span className="text-xs font-semibold text-slate-400">รายการ</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">คะแนนต่ำกว่าเกณฑ์มาตรฐาน (คะแนน ≤ 2)</p>
        </div>

        {/* Resolved Actions Card */}
        <div
          onClick={() => setSelectedStatus("resolved")}
          className={`gridgeist-card p-5 relative overflow-hidden transition-all duration-200 cursor-pointer ${
            selectedStatus === "resolved" ? "ring-2 ring-emerald-500/50 shadow-md" : "hover:shadow-md"
          }`}
          style={{ borderLeft: "4px solid #1E8E5A" }}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">แก้ไขเรียบร้อย (Resolved)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-navy dark:text-slate-100 tracking-tight">
            {resolvedCount} <span className="text-xs font-semibold text-slate-400">รายการ</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">อัปเดตรูปหลักฐานยืนยันการแก้ไขแล้ว</p>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-audit-hairline dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อข้อบกพร่อง, สาขา, โน้ต..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกสาขา</option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกหมวดประเมิน</option>
            {TEMPLATE.sections.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ค้างแก้ไข
            </button>
            <button
              onClick={() => setSelectedStatus("resolved")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === "resolved"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              แก้ไขแล้ว
            </button>
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === "all"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Defect Cards List (Clean Split Layout) ── */}
      <div className="space-y-4">
        {filteredDefects.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/50 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                ไม่พบรายการข้อบกพร่องในเงื่อนไขที่เลือก
              </h3>
              <p className="text-xs text-slate-400">
                สาขานี้ปฏิบัติตามมาตรฐานได้ดี หรือไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา
              </p>
            </div>
          </div>
        ) : (
          filteredDefects.map((defect, idx) => {
            const itemTitle = getItemTitle(defect.itemId);
            const guideInfo = getGuideForItem(defect.itemId, itemTitle);
            const isResolved = defect.photosAfter.length > 0;
            const [y, m, d] = defect.date.split("-");
            const thDate = `${d}/${m}/${y}`;
            const isCritical = defect.status === "ร้ายแรง";
            const borderAccentColor = isCritical ? "#C23B3B" : isResolved ? "#1E8E5A" : "#C77C00";
            const allPhotos = [...(defect.photosBefore || []), ...(defect.photosAfter || [])];

            return (
              <div
                key={`${defect.auditId}-${defect.itemId}-${idx}`}
                className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 sm:p-6 transition-all shadow-xs hover:shadow-sm space-y-4 overflow-hidden"
                style={{ borderLeft: `4px solid ${borderAccentColor}` }}
              >
                {/* Header Metadata Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg font-bold">
                      {branchName(defect.branchId)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> ตรวจเมื่อ {thDate}
                    </span>
                    <span className="text-slate-400">· ผู้ตรวจ: {defect.auditor}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                        isCritical
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      คะแนน {defect.score} / 5 ({defect.status})
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                        isResolved
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      }`}
                    >
                      {isResolved ? "แก้ไขแล้ว" : "ค้างแก้ไข"}
                    </span>
                  </div>
                </div>

                {/* Split Layout: Left Details (60%) vs Right Resolution Guide (40%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Column (60%): Defect Info */}
                  <div className="lg:col-span-7 space-y-3">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {guideInfo.category}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {itemTitle}
                      </h3>
                    </div>

                    {/* Responsible Staff */}
                    {defect.responsibleIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-slate-400 font-medium">ผู้รับผิดชอบ:</span>
                        {defect.responsibleIds.map((empId) => {
                          const emp = EMPLOYEES.find((e) => e.id === empId);
                          if (!emp) return null;
                          return (
                            <span
                              key={empId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-600"
                            >
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {emp.firstName} {emp.lastName}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Auditor Comment */}
                    {defect.note && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                        <div className="text-xs font-bold text-slate-400 mb-1">ข้อคิดเห็นจากผู้ตรวจ:</div>
                        <p className="font-semibold">{defect.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column (40%): SOP Standard Resolution Guide */}
                  <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border-l-2 border-blue-600 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" /> คู่มือแนวทางแก้ไขตามมาตรฐาน SOP
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                          ความสำคัญ: {guideInfo.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {guideInfo.guide}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>มาตรฐานการดำเนินงานสาขา</span>
                      <span className="font-mono text-slate-400">SOP-{defect.itemId}</span>
                    </div>
                  </div>

                </div>

                {/* Footer Row: Photo Thumbnails & Action Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Photo Thumbnails */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> หลักฐานรูปถ่าย:
                    </span>
                    {allPhotos.length > 0 ? (
                      allPhotos.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setPreviewImage(img)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition truncate max-w-[140px]"
                        >
                          📷 {img}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-400">ไม่มีรูปแนบ</span>
                    )}
                  </div>

                  {/* Mark as resolved button */}
                  {!isResolved ? (
                    <button
                      onClick={() =>
                        setResolvingItem({
                          auditId: defect.auditId,
                          itemId: defect.itemId,
                          title: itemTitle,
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" /> บันทึกการแก้ไขเรียบร้อย
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 ml-auto bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ดำเนินการแก้ไขเรียบร้อยแล้ว
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Resolve Action Modal ── */}
      {resolvingItem && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                อัปเดตหลักฐานยืนยันการแก้ไข
              </h3>
              <button onClick={() => setResolvingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              หัวข้อ: <strong className="text-slate-800 dark:text-slate-200 font-bold">{resolvingItem.title}</strong>
            </div>

            <form onSubmit={handleMarkResolved} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อไฟล์รูปภาพหลักฐานหลังแก้ไข (Photo After):
                </label>
                <input
                  type="text"
                  placeholder="เช่น fixed_photo_01.jpg"
                  value={resolvePhoto}
                  onChange={(e) => setResolvePhoto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  บันทึกโน้ตการแก้ไขเพิ่มเติม (Optional):
                </label>
                <textarea
                  rows={3}
                  placeholder="ระบุแนวทางและผลการแก้ไข เช่น ดำเนินการทำความสะอาดและจัดระเบียบชั้นเรียบร้อยแล้ว..."
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  ยืนยันอัปเดตการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
