"use client";

import React, { useState } from "react";
import { Search, Users, History, Mail, Phone, Building2, Plus, X } from "lucide-react";
import { EMPLOYEES, BRANCHES, ROLES, branchName } from "@/lib/mock-data";
import { Employee } from "@/lib/types/audit";

interface EmployeeDirectoryProps {
  selectedEmployeeId?: string | null;
}

export default function EmployeeDirectory({ selectedEmployeeId }: EmployeeDirectoryProps) {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(
    selectedEmployeeId ? employees.find((e) => e.id === selectedEmployeeId) || null : null
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    code: "", firstName: "", lastName: "", nickname: "", role: ROLES[0], branchId: BRANCHES[0]?.id, email: "", phone: ""
  });

  const [transferBranchId, setTransferBranchId] = useState(BRANCHES[0]?.id);
  const [transferDate, setTransferDate] = useState("");

  const filteredEmployees = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName} ${e.nickname || ""}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return (
      fullName.includes(query) ||
      e.code.toLowerCase().includes(query) ||
      e.role.toLowerCase().includes(query) ||
      branchName(e.branchId).toLowerCase().includes(query)
    );
  });

  const handleAddEmployee = () => {
    const n = employees.length + 1;
    const code = newEmp.code || `EMP-${String(n).padStart(4, "0")}`;
    const id = `E${String(n).padStart(3, "0")}`;
    const empToAdd: Employee = {
      id,
      code,
      firstName: newEmp.firstName || "ไม่มีชื่อ",
      lastName: newEmp.lastName || "",
      nickname: newEmp.nickname || "",
      role: newEmp.role || ROLES[0],
      branchId: newEmp.branchId || BRANCHES[0]?.id,
      zone: BRANCHES.find(b => b.id === newEmp.branchId)?.zone || "เขตกรุงเทพฯ",
      email: newEmp.email || "",
      phone: newEmp.phone || "",
      assignments: [{ branchId: newEmp.branchId || BRANCHES[0]?.id, startDate: new Date().toISOString().slice(0, 10), endDate: null }]
    };
    
    // Update global mock (for other pages) and local state
    EMPLOYEES.push(empToAdd);
    setEmployees([...EMPLOYEES]);
    setShowAddModal(false);
    setNewEmp({ code: "", firstName: "", lastName: "", nickname: "", role: ROLES[0], branchId: BRANCHES[0]?.id, email: "", phone: "" });
  };

  const handleTransfer = () => {
    if (!selectedEmp || !transferDate || !transferBranchId) return;
    
    const updatedEmp = { ...selectedEmp };
    const lastAssignment = updatedEmp.assignments[updatedEmp.assignments.length - 1];
    if (lastAssignment && lastAssignment.endDate === null) {
      lastAssignment.endDate = transferDate;
    }
    
    updatedEmp.assignments.push({
      branchId: transferBranchId,
      startDate: transferDate,
      endDate: null
    });
    
    updatedEmp.branchId = transferBranchId;
    updatedEmp.zone = BRANCHES.find(b => b.id === transferBranchId)?.zone || updatedEmp.zone;
    
    // Update global and local
    const index = EMPLOYEES.findIndex(e => e.id === updatedEmp.id);
    if (index > -1) EMPLOYEES[index] = updatedEmp;
    
    setEmployees([...EMPLOYEES]);
    setSelectedEmp(updatedEmp);
    setTransferDate("");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">รายชื่อพนักงานและประวัติการโยกย้ายสาขา</h1>
          <p className="text-xs font-medium text-audit-slate">
            ตรวจสอบสังกัดปัจจุบันและประวัติการโยกย้ายย้อนหลัง สำหรับประเมินผลการทำงาน
          </p>
        </div>
      </div>

      {/* Search & Add */}
      <div className="gridgeist-card p-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-audit-slate absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อพนักงาน, รหัสพนักงาน, ตำแหน่ง หรือสาขา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-audit-hairline rounded-lg text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-audit-blue"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-audit-blue text-white rounded-lg text-xs font-bold hover:bg-navy transition"
        >
          <Plus className="w-4 h-4" /> เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* Main Grid: Employee List & History Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List Table */}
        <div className={`${selectedEmp ? "lg:col-span-7" : "lg:col-span-12"} gridgeist-card overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-audit-hairline text-navy font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">รหัส</th>
                  <th className="p-3.5">ชื่อ-นามสกุล</th>
                  <th className="p-3.5">ตำแหน่ง</th>
                  <th className="p-3.5">สาขาปัจจุบัน</th>
                  <th className="p-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-audit-hairline">
                {filteredEmployees.map((e) => (
                  <tr
                    key={e.id}
                    className={`hover:bg-slate-50 transition cursor-pointer ${
                      selectedEmp?.id === e.id ? "bg-audit-tint/50 font-semibold" : ""
                    }`}
                    onClick={() => setSelectedEmp(e)}
                  >
                    <td className="p-3.5 font-bold text-audit-blue">{e.code}</td>
                    <td className="p-3.5 font-bold text-navy">
                      {e.nickname && <span className="text-audit-blue mr-1">({e.nickname})</span>} {e.firstName} {e.lastName}
                    </td>
                    <td className="p-3.5 text-slate-600">{e.role}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{branchName(e.branchId)}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedEmp(e);
                        }}
                        className="text-audit-blue hover:underline font-bold"
                      >
                        ดูประวัติ / ย้ายสาขา
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Employee Assignment History Details */}
        {selectedEmp && (
          <div className="lg:col-span-5 space-y-6 h-fit sticky top-6">
            <div className="gridgeist-card p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-audit-hairline pb-3">
                <div>
                  <span className="text-xs font-bold text-audit-blue">{selectedEmp.code}</span>
                  <h2 className="text-lg font-extrabold text-navy">
                    {selectedEmp.nickname && <span className="text-audit-blue mr-1">({selectedEmp.nickname})</span>} {selectedEmp.firstName} {selectedEmp.lastName}
                  </h2>
                  <div className="text-xs font-semibold text-slate-500">{selectedEmp.role}</div>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-navy">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-audit-blue" /> {selectedEmp.email || "-"}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-audit-blue" /> {selectedEmp.phone || "-"}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-audit-blue" /> สาขาปัจจุบัน: {branchName(selectedEmp.branchId)}
                </div>
              </div>

              {/* Transfer Branch Form */}
              <div className="pt-3 border-t border-audit-hairline">
                <h3 className="text-xs font-bold text-navy mb-2">ย้ายสังกัด / สาขา</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">สาขาปลายทาง</label>
                      <select 
                        value={transferBranchId}
                        onChange={e => setTransferBranchId(e.target.value)}
                        className="w-full border border-audit-hairline rounded p-1.5 text-xs focus:ring-1 focus:ring-audit-blue outline-none"
                      >
                        {BRANCHES.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">วันที่เริ่มต้น</label>
                      <input 
                        type="date"
                        value={transferDate}
                        onChange={e => setTransferDate(e.target.value)}
                        className="w-full border border-audit-hairline rounded p-1.5 text-xs focus:ring-1 focus:ring-audit-blue outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleTransfer}
                    disabled={!transferDate || transferBranchId === selectedEmp.branchId}
                    className="w-full py-1.5 bg-audit-tint text-audit-blue hover:bg-audit-blue hover:text-white disabled:opacity-50 disabled:hover:bg-audit-tint disabled:hover:text-audit-blue transition rounded text-xs font-bold"
                  >
                    บันทึกการย้ายสาขา
                  </button>
                </div>
              </div>

              {/* Transfer History Timeline */}
              <div className="pt-3 border-t border-audit-hairline">
                <h3 className="text-xs font-bold text-navy mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-audit-blue" /> ประวัติการโยกย้าย
                </h3>
                <div className="space-y-3 pl-2 border-l-2 border-audit-blue/40">
                  {selectedEmp.assignments.slice().reverse().map((asg, idx) => (
                    <div key={idx} className="relative pl-4 space-y-0.5">
                      <div className="absolute -left-[11px] top-1.5 w-3 h-3 rounded-full bg-audit-blue border-2 border-white"></div>
                      <div className="text-xs font-bold text-navy">{branchName(asg.branchId)}</div>
                      <div className="text-[11px] text-slate-500">
                        ตั้งแต่วันที่ {asg.startDate} {asg.endDate ? `ถึง ${asg.endDate}` : "(ปัจจุบัน)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-audit-hairline flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-extrabold text-navy flex items-center gap-2">
                <Users className="w-4 h-4 text-audit-blue" /> เพิ่มพนักงานใหม่
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสพนักงาน (ถ้าเว้นว่าง ระบบจะรันให้)</label>
                <input 
                  type="text" 
                  value={newEmp.code}
                  onChange={e => setNewEmp({...newEmp, code: e.target.value})}
                  placeholder="เช่น EMP-0015"
                  className="w-full border border-audit-hairline rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อจริง <span className="text-status-bad">*</span></label>
                  <input 
                    type="text" 
                    value={newEmp.firstName}
                    onChange={e => setNewEmp({...newEmp, firstName: e.target.value})}
                    className="w-full border border-audit-hairline rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">นามสกุล <span className="text-status-bad">*</span></label>
                  <input 
                    type="text" 
                    value={newEmp.lastName}
                    onChange={e => setNewEmp({...newEmp, lastName: e.target.value})}
                    className="w-full border border-audit-hairline rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อเล่น</label>
                <input 
                  type="text" 
                  value={newEmp.nickname}
                  onChange={e => setNewEmp({...newEmp, nickname: e.target.value})}
                  placeholder="เช่น มด"
                  className="w-full border border-audit-hairline rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ตำแหน่ง</label>
                  <select 
                    value={newEmp.role}
                    onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                    className="w-full border border-audit-hairline rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">สาขาประจำ (เริ่มต้น)</label>
                  <select 
                    value={newEmp.branchId}
                    onChange={e => setNewEmp({...newEmp, branchId: e.target.value})}
                    className="w-full border border-audit-hairline rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                  >
                    {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-audit-hairline flex justify-end gap-2 bg-slate-50">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-navy transition"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAddEmployee}
                disabled={!newEmp.firstName || !newEmp.lastName}
                className="px-4 py-2 bg-audit-blue text-white rounded-lg text-xs font-bold hover:bg-navy transition disabled:opacity-50"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
