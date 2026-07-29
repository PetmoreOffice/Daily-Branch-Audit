"use client";

import React, { useState, useEffect } from "react";
import { Search, Users, History, Mail, Phone, Building2, Plus, X, Loader2 } from "lucide-react";
import { ROLES, EMPLOYEES, BRANCHES, addMockEmployee, syncEmployees, cleanBranchName } from "@/lib/mock-data";
import { getEmployees, getBranches, addEmployee, transferEmployee, updateEmployee } from "@/app/actions/employee";

interface EmployeeDirectoryProps {
  selectedEmployeeId?: string | null;
}

export default function EmployeeDirectory({ selectedEmployeeId }: EmployeeDirectoryProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState<any>({
    firstName: "", lastName: "", nickname: "", role: ROLES[0], branchId: "", email: "", phone: ""
  });

  const [transferBranchId, setTransferBranchId] = useState("");
  const [transferDate, setTransferDate] = useState("");

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ email: "", phone: "" });
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (selectedEmp) {
      setSelectedRole(selectedEmp.role || ROLES[0]);
    }
  }, [selectedEmp]);

  async function loadData() {
    try {
      const [empData, branchData] = await Promise.all([
        getEmployees(),
        getBranches()
      ]);
      const validEmps = empData || [];
      const validBranches = branchData || [];

      syncEmployees(validEmps);
      setEmployees(validEmps);
      setBranches(validBranches);

      if (validBranches.length > 0) {
        setNewEmp((prev: any) => ({ ...prev, branchId: validBranches[0].id }));
        setTransferBranchId(validBranches[0].id);
      }

      if (selectedEmployeeId) {
        setSelectedEmp(validEmps.find((e: any) => e.id === selectedEmployeeId) || null);
      } else if (selectedEmp) {
        setSelectedEmp(validEmps.find((e: any) => e.id === selectedEmp.id) || null);
      }
    } catch (err) {
      console.error("Error loading employee data from Supabase DB:", err);
      setEmployees([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  const branchName = (id: string) => {
    return branches.find(b => b.id === id)?.name || "ไม่ทราบสาขา";
  };

  const filteredEmployees = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName} ${e.nickname || ""}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return (
      fullName.includes(query) ||
      e.code.toLowerCase().includes(query) ||
      e.role.toLowerCase().includes(query) ||
      (e.currentBranch?.name || "").toLowerCase().includes(query)
    );
  });

  const handleAddEmployee = async () => {
    try {
      setIsSaving(true);
      const created = await addEmployee(newEmp).catch(() => null);
      const addedObj = created || addMockEmployee(newEmp);
      addMockEmployee(addedObj);
      await loadData();
      setShowAddModal(false);
      setNewEmp({ firstName: "", lastName: "", nickname: "", role: ROLES[0], branchId: branches[0]?.id || "", email: "", phone: "" });
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!selectedEmp) return;
    setIsSaving(true);
    try {
      await updateEmployee(selectedEmp.id, contactForm);
      await loadData();
      setIsEditingContact(false);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedEmp || !selectedRole) return;
    setIsSaving(true);
    try {
      await updateEmployee(selectedEmp.id, { role: selectedRole });
      setSelectedEmp((prev: any) => prev ? { ...prev, role: selectedRole } : null);
      await loadData();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการปรับเปลี่ยนตำแหน่ง");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedEmp || !transferDate || !transferBranchId) return;
    try {
      setIsSaving(true);
      await transferEmployee(selectedEmp.id, transferBranchId);
      await loadData(); // refresh list
      setTransferDate("");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการย้ายสาขา");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-audit-blue" />
        <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

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
      <div className="bg-white rounded-xl border border-audit-hairline shadow-sm p-4 flex gap-3 items-center">
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
          className="flex items-center gap-1.5 px-4 py-2 bg-audit-blue text-white rounded-lg text-xs font-bold hover:bg-navy transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* Main Grid: Employee List & History Drawer */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* List Table */}
        <div className={`flex-1 min-w-0 bg-white rounded-xl border border-audit-hairline shadow-sm overflow-hidden`}>
          {filteredEmployees.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-audit-slate" />
              </div>
              <div className="text-sm font-bold text-navy">
                {employees.length === 0 ? "ยังไม่มีข้อมูลพนักงาน" : "ไม่พบเดือนที่ตรงกับคำค้นหา"}
              </div>
              <div className="text-xs text-audit-slate">
                {employees.length === 0 ? "กด 'เพิ่มพนักงานใหม่' เพื่อเพิ่มข้อมูลพนักงานเข้าระบบ" : "ลองเปลี่ยนคำค้นหาหรือล่างตัวกรอง"}
              </div>
            </div>
          ) : (
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
                    <td className="p-3.5 text-slate-700 font-medium truncate max-w-[180px]" title={cleanBranchName(e.currentBranch?.name) || branchName(e.branchId)}>
                      {cleanBranchName(e.currentBranch?.name) || branchName(e.branchId)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedEmp(e);
                          setContactForm({ email: e.email || "", phone: e.phone || "" });
                          setIsEditingContact(false);
                        }}
                        className="text-audit-blue hover:underline font-bold"
                      >
                        ดูประวัติ / ย้ายสาขา
                      </button>
                    </td>
                  </tr>
                ))}
              {filteredEmployees.length === 0 && employees.length > 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">ไม่พบข้อมูลพนักงาน</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          )}
        </div>

        {/* Selected Employee Assignment History Details */}
        {selectedEmp && (
          <div className="w-full lg:w-[40%] xl:w-[35%] shrink-0">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl border border-audit-hairline shadow-sm overflow-hidden">
                {/* Avatar Header */}
              <div className="bg-navy p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-xl">
                    {selectedEmp.firstName?.[0] || ""}{selectedEmp.lastName?.[0] || ""}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white/60 mb-0.5">{selectedEmp.code}</div>
                  <h2 className="text-base font-extrabold text-white leading-tight">
                    {selectedEmp.nickname && <span className="text-white/70">({selectedEmp.nickname}) </span>}{selectedEmp.firstName} {selectedEmp.lastName}
                  </h2>
                  <div className="text-xs font-semibold text-white/70 mt-0.5">{selectedEmp.role}</div>
                </div>
                <button onClick={() => setSelectedEmp(null)} className="ml-auto text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy">ข้อมูลติดต่อ</h3>
                  {!isEditingContact ? (
                    <button onClick={() => {
                      setContactForm({ email: selectedEmp.email || "", phone: selectedEmp.phone || "" });
                      setIsEditingContact(true);
                    }} className="text-audit-blue hover:underline font-semibold text-xs">แก้ไขข้อมูล</button>
                  ) : (
                    <div className="space-x-2">
                      <button onClick={() => setIsEditingContact(false)} className="text-slate-500 hover:underline font-semibold text-xs">ยกเลิก</button>
                      <button onClick={handleUpdateContact} disabled={isSaving} className="text-audit-blue hover:underline font-bold text-xs">บันทึก</button>
                    </div>
                  )}
                </div>
                
                {!isEditingContact ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-audit-blue" /> {selectedEmp.email || "-"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-audit-blue" /> {selectedEmp.phone || "-"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-audit-blue flex-shrink-0" />
                      <input 
                        type="email" 
                        value={contactForm.email}
                        onChange={e => setContactForm({...contactForm, email: e.target.value})}
                        placeholder="อีเมล..."
                        className="w-full border border-audit-hairline rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-audit-blue flex-shrink-0" />
                      <input 
                        type="tel" 
                        value={contactForm.phone}
                        onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                        placeholder="เบอร์โทรศัพท์..."
                        className="w-full border border-audit-hairline rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-audit-blue"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600 pt-2 border-t border-audit-hairline">
                  <Building2 className="w-3.5 h-3.5 text-audit-blue" /> สาขาปัจจุบัน: {cleanBranchName(selectedEmp.currentBranch?.name) || branchName(selectedEmp.branchId)}
                </div>
              </div>

              {/* Change Position Dropdown */}
              <div className="pt-3 border-t border-audit-hairline">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-bold text-navy">ปรับ / เปลี่ยนตำแหน่ง</h3>
                  <span className="text-xs font-semibold text-slate-400">ปัจจุบัน: {selectedEmp.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 border border-audit-hairline rounded p-1.5 text-xs focus:ring-1 focus:ring-audit-blue outline-none bg-slate-50 font-medium text-navy"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateRole}
                    disabled={selectedRole === selectedEmp.role || isSaving}
                    className="px-3 py-1.5 bg-audit-blue text-white rounded text-xs font-bold hover:bg-navy disabled:opacity-40 transition shrink-0 flex items-center gap-1"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    บันทึก
                  </button>
                </div>
              </div>

              {/* Transfer Branch Form */}
              <div className="pt-3 border-t border-audit-hairline">
                <h3 className="text-xs font-bold text-navy mb-2">ย้ายสังกัด / สาขา</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">สาขาปลายทาง</label>
                      <select 
                        value={transferBranchId}
                        onChange={e => setTransferBranchId(e.target.value)}
                        className="w-full border border-audit-hairline rounded p-1.5 text-xs focus:ring-1 focus:ring-audit-blue outline-none"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{cleanBranchName(b.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">วันที่เริ่มต้น</label>
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
                    disabled={!transferDate || transferBranchId === selectedEmp.branchId || isSaving}
                    className="w-full py-1.5 bg-audit-tint text-audit-blue hover:bg-audit-blue hover:text-white disabled:opacity-50 disabled:hover:bg-audit-tint disabled:hover:text-audit-blue transition rounded text-xs font-bold flex justify-center items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
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
                  {selectedEmp.assignments && selectedEmp.assignments.map((asg: any, idx: number) => (
                    <div key={idx} className="relative pl-4 space-y-0.5">
                      <div className="absolute -left-[11px] top-1.5 w-3 h-3 rounded-full bg-audit-blue border-2 border-white"></div>
                      <div className="text-xs font-bold text-navy">{cleanBranchName(asg.branch?.name) || branchName(asg.branchId)}</div>
                      <div className="text-xs text-slate-500">
                        ตั้งแต่วันที่ {asg.startDate} {asg.endDate ? `ถึง ${asg.endDate}` : "(ปัจจุบัน)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-audit-hairline">
            <div className="p-5 border-b border-audit-hairline flex justify-between items-center bg-navy">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4" /> เพิ่มพนักงานใหม่
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อจริง <span className="text-status-bad">*</span></label>
                  <input 
                    type="text" 
                    value={newEmp.firstName}
                    onChange={e => setNewEmp({...newEmp, firstName: e.target.value})}
                    className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">นามสกุล <span className="text-status-bad">*</span></label>
                  <input 
                    type="text" 
                    value={newEmp.lastName}
                    onChange={e => setNewEmp({...newEmp, lastName: e.target.value})}
                    className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
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
                  className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล (ไม่บังคับ)</label>
                  <input 
                    type="email" 
                    value={newEmp.email}
                    onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                    placeholder="example@company.com"
                    className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
                  <input 
                    type="tel" 
                    value={newEmp.phone}
                    onChange={e => setNewEmp({...newEmp, phone: e.target.value})}
                    placeholder="08X-XXX-XXXX"
                    className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ตำแหน่ง</label>
                  <select 
                    value={newEmp.role}
                    onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                    className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">สาขาประจำ (เริ่มต้น)</label>
                  <select 
                    value={newEmp.branchId}
                    onChange={e => setNewEmp({...newEmp, branchId: e.target.value})}
                    className="w-full border border-audit-hairline rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-audit-blue"
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-audit-hairline flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-navy transition rounded-xl hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAddEmployee}
                disabled={!newEmp.firstName || !newEmp.lastName || isSaving}
                className="px-5 py-2 bg-audit-blue text-white rounded-xl text-xs font-bold hover:bg-navy transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
