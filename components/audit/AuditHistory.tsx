"use client";

import React, { useState } from "react";
import { Search, CalendarDays, Filter, Eye, ChevronRight, X, UserCheck } from "lucide-react";
import { Audit, AuditItemResult } from "@/lib/types/audit";
import { branchName, itemName, employeeName, avgScore, statusFromScore } from "@/lib/mock-data";

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">ประวัติการตรวจประเมินสาขา</h1>
          <p className="text-xs font-medium text-audit-slate">ค้นหาและเรียกดูผลการประเมินย้อนหลัง พร้อมรายการข้อบกพร่องที่ต้องแก้ไข</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="gridgeist-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
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

      {/* Audit Table */}
      <div className="gridgeist-card overflow-hidden">
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
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-audit-slate font-medium">
                    ไม่พบรายการตรวจประเมินที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => {
                  const score = avgScore(a.items);
                  const status = statusFromScore(score, 5);
                  const badgeClass =
                    status === "ผ่าน"
                      ? "bg-status-okBg text-status-ok"
                      : status === "ต้องปรับปรุง"
                      ? "bg-status-warnBg text-status-warn"
                      : "bg-status-badBg text-status-bad";

                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-audit-blue">{a.id}</td>
                      <td className="p-3.5 font-medium text-slate-600">{a.date}</td>
                      <td className="p-3.5 font-bold text-navy">{branchName(a.branchId)}</td>
                      <td className="p-3.5 font-medium text-slate-600">{a.auditor}</td>
                      <td className="p-3.5 text-center font-extrabold text-navy text-sm">
                        {score.toFixed(2)} / 5
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${badgeClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedAudit(a)}
                          className="inline-flex items-center gap-1 bg-audit-tint text-audit-blue hover:bg-audit-blue hover:text-white px-2.5 py-1 rounded-lg font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-audit-hairline p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-audit-hairline pb-4">
              <div>
                <span className="text-xs font-bold text-audit-blue">{selectedAudit.id}</span>
                <h2 className="text-xl font-extrabold text-navy">{branchName(selectedAudit.branchId)}</h2>
                <p className="text-xs text-audit-slate">
                  ตรวจโดย {selectedAudit.auditor} เมื่อวันที่ {selectedAudit.date} (GPS: {selectedAudit.gps})
                </p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Items Detail List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-navy">สรุปผลประเมินรายหัวข้อ</h3>
              {selectedAudit.items.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-navy">{itemName(item.itemId)}</span>
                    <span className="font-extrabold text-audit-blue">{item.score} / 5</span>
                  </div>

                  {item.note && (
                    <div className="text-xs text-status-bad bg-status-badBg p-2 rounded-lg font-medium">
                      หมายเหตุ: {item.note}
                    </div>
                  )}

                  {item.responsibleIds.length > 0 && (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                      <UserCheck className="w-3.5 h-3.5 text-audit-blue" />
                      ผู้รับผิดชอบ: {item.responsibleIds.map((id) => employeeName(id)).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-audit-hairline pt-4 flex justify-end">
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
