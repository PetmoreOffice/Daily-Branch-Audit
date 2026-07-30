"use client";

import React, { useState } from "react";
import { Search, CalendarDays, Filter, Eye, ChevronRight, X, UserCheck, ClipboardX, BarChart2, Camera, FileText, Download } from "lucide-react";
import { Audit } from "@/lib/types/audit";
import { branchName, itemName, employeeName, avgScore, statusFromScore, ALL_ITEMS, formatAuditorName, formatDateDDMMYYYY } from "@/lib/mock-data";
import { exportAuditToPDF } from "@/lib/pdfExporter";

interface AuditHistoryProps {
  audits: Audit[];
}

export default function AuditHistory({ audits }: AuditHistoryProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  const filteredAudits = audits.filter((a) => {
    const bName = branchName(a.branchId).toLowerCase();
    const matchQuery =
      bName.includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.date.includes(searchTerm);

    if (!matchQuery) return false;
    if (statusFilter === "all") return true;
    const avg = avgScore(a.items);
    const overallStatus = statusFromScore(avg, 5);
    return overallStatus === statusFilter;
  });

  function scoreColor(score: number, max: number) {
    const pct = score / max;
    if (pct >= 0.8) return { bar: "#1E8E5A", bg: "#E8F5EE", text: "text-status-ok" };
    if (pct >= 0.6) return { bar: "#C77C00", bg: "#FCF1DE", text: "text-status-warn" };
    return { bar: "#C23B3B", bg: "#FBEAEA", text: "text-status-bad" };
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">ประวัติการตรวจประเมินสาขา</h1>
          <p className="text-xs font-medium text-audit-slate">ค้นหาและเรียกดูผลการประเมินย้อนหลัง พร้อมรายการข้อบกพร่องที่ต้องแก้ไข</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-audit-tint text-audit-blue px-3 py-2 rounded-lg border border-audit-blue/20">
          <CalendarDays className="w-4 h-4" />
          {audits.length} รายการทั้งหมด
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-audit-hairline shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-audit-slate absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสาขา, รหัสเอกสาร, ผู้ตรวจ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-audit-hairline rounded-lg text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-audit-slate" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-audit-hairline rounded-lg px-3 py-2 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
          >
            <option value="all">ทุกสถานะผลการประเมิน</option>
            <option value="ผ่าน">ผ่าน</option>
            <option value="ต้องปรับปรุง">ต้องปรับปรุง</option>
            <option value="ร้ายแรง">ร้ายแรง</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {audits.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-audit-hairline p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
            <ClipboardX className="w-8 h-8 text-audit-slate" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-navy mb-1">ยังไม่มีประวัติการตรวจประเมิน</h2>
            <p className="text-xs text-audit-slate leading-relaxed max-w-sm">
              เมื่อทำการตรวจประเมินสาขาเสร็จแล้ว รายการทั้งหมดจะปรากฏที่นี่ พร้อมตัวกรองและการค้นหา
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-audit-blue px-4 py-2 bg-audit-tint rounded-lg border border-audit-blue/20">
            <BarChart2 className="w-3.5 h-3.5" /> ไปที่เมนู "ตรวจประเมินสาขา" เพื่อเพิ่มข้อมูล
          </div>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="bg-white rounded-xl border border-audit-hairline p-10 flex flex-col items-center text-center gap-3">
          <Search className="w-8 h-8 text-audit-slate opacity-40" />
          <div className="text-sm font-bold text-navy">ไม่พบรายการที่ตรงกับเงื่อนไข</div>
          <div className="text-xs text-audit-slate">ลองเปลี่ยนคำค้นหา หรือยกเลิกตัวกรองสถานะ</div>
        </div>
      ) : (
        /* Audit Table */
        <div className="bg-white rounded-xl border border-audit-hairline shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-audit-hairline text-navy font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">รหัสเอกสาร</th>
                  <th className="p-3.5">วันที่ตรวจ</th>
                  <th className="p-3.5">สาขา</th>
                  <th className="p-3.5">ผู้ตรวจประเมิน</th>
                  <th className="p-3.5 text-center">คะแนนเฉลี่ย</th>
                  <th className="p-3.5 text-center">สถานะ</th>
                  <th className="p-3.5 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-audit-hairline">
                {filteredAudits.map((a) => {
                  const score = avgScore(a.items);
                  const status = statusFromScore(score, 5);
                  const colors = scoreColor(score, 5);
                  const pct = Math.min(100, (score / 5) * 100);
                  const badgeClass =
                    status === "ผ่าน"
                      ? "bg-status-okBg text-status-ok"
                      : status === "ต้องปรับปรุง"
                      ? "bg-status-warnBg text-status-warn"
                      : "bg-status-badBg text-status-bad";

                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition group">
                      <td className="p-3.5 font-bold text-audit-blue">
                        <button
                          onClick={() => exportAuditToPDF(a)}
                          title="คลิกเพื่อดาวน์โหลดรายงานผลการประเมินเป็นไฟล์ PDF"
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 focus:outline-none"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {a.id}
                        </button>
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">{formatDateDDMMYYYY(a.date)}</td>
                      <td className="p-3.5 font-bold text-navy">{branchName(a.branchId)}</td>
                      <td className="p-3.5 font-medium text-slate-600 max-w-[160px] truncate">{formatAuditorName(a.auditor, a.branchId)}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-extrabold text-sm ${colors.text}`}>{score.toFixed(2)}<span className="text-xs font-semibold text-slate-400"> /5</span></span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors.bar }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${badgeClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedAudit(a)}
                          className="inline-flex items-center gap-1 bg-audit-tint text-audit-blue hover:bg-audit-blue hover:text-white px-2.5 py-1 rounded-lg font-semibold transition text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-audit-hairline text-xs text-slate-400 font-medium">
            แสดง {filteredAudits.length} จาก {audits.length} รายการ
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-audit-hairline">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b border-audit-hairline p-5">
              <div>
                <span className="text-xs font-bold text-audit-blue">{selectedAudit.id}</span>
                <h2 className="text-xl font-extrabold text-navy">{branchName(selectedAudit.branchId)}</h2>
                <p className="text-xs text-audit-slate">
                  ตรวจโดย {formatAuditorName(selectedAudit.auditor, selectedAudit.branchId)} · วันที่ {formatDateDDMMYYYY(selectedAudit.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Overall score badge */}
                {(() => {
                  const avg = avgScore(selectedAudit.items);
                  const status = statusFromScore(avg, 5);
                  const colors = scoreColor(avg, 5);
                  return (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => exportAuditToPDF(selectedAudit)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-4 h-4" /> ดาวน์โหลด PDF
                      </button>
                      <div className="text-center px-4 py-2 rounded-xl" style={{ background: colors.bg }}>
                        <div className={`text-2xl font-black ${colors.text}`}>{avg.toFixed(2)}</div>
                        <div className={`text-xs font-bold ${colors.text}`}>{status}</div>
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-navy transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Audit Items with progress bars */}
            <div className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-navy">สรุปผลประเมินรายหัวข้อ</h3>
              {selectedAudit.items.map((item, idx) => {
                const def = ALL_ITEMS.find((d) => d.id === item.itemId);
                const max = def?.maxScore || 5;
                const pct = Math.min(100, (item.score / max) * 100);
                const colors = scoreColor(item.score, max);
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-xs text-navy leading-snug flex-1">{itemName(item.itemId)}</span>
                      <span className={`font-extrabold text-sm shrink-0 ${colors.text}`}>{item.score}<span className="text-xs text-slate-400 font-semibold">/{max}</span></span>
                    </div>
                    {/* Score progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: colors.bar }}
                      />
                    </div>
                    {item.note && (
                      <div className="text-xs text-navy bg-white p-2.5 rounded-lg border border-audit-hairline flex items-start gap-2 shadow-xs">
                        <FileText className="w-3.5 h-3.5 text-audit-blue shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-navy">หมายเหตุ / รายละเอียดอ้างอิง:</span>{" "}
                          <span className="text-slate-700">{item.note}</span>
                        </div>
                      </div>
                    )}
                    {((item.photosBefore && item.photosBefore.length > 0) || (item.photosAfter && item.photosAfter.length > 0)) && (
                      <div className="space-y-1 pt-1">
                        <div className="text-xs font-bold text-navy flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-audit-blue" />
                          รูปภาพแนบประกอบ ({(item.photosBefore?.length || 0) + (item.photosAfter?.length || 0)} ภาพ):
                        </div>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {item.photosBefore?.map((url, pIdx) => (
                            <a key={`b-${pIdx}`} href={url} target="_blank" rel="noreferrer" className="relative group shrink-0">
                              <img src={url} alt={`photo-${pIdx}`} className="w-16 h-16 object-cover rounded-lg border border-audit-hairline shadow-xs group-hover:opacity-90 transition" />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 text-white text-xs font-bold rounded-lg transition">ขยาย</span>
                            </a>
                          ))}
                          {item.photosAfter?.map((url, pIdx) => (
                            <a key={`a-${pIdx}`} href={url} target="_blank" rel="noreferrer" className="relative group shrink-0">
                              <img src={url} alt={`photo-after-${pIdx}`} className="w-16 h-16 object-cover rounded-lg border border-audit-hairline shadow-xs group-hover:opacity-90 transition" />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 text-white text-xs font-bold rounded-lg transition">ขยาย</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.responsibleIds.length > 0 && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-audit-blue shrink-0" />
                        ผู้รับผิดชอบ: {item.responsibleIds.map((id) => employeeName(id)).join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-audit-hairline p-4 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedAudit(null)}
                className="bg-navy text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-audit-blue transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
