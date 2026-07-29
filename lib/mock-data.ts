import { Zone, Branch, Employee, AuditTemplate, Audit, AuditTemplateItem, AuditItemResult } from "./types/audit";

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}
const rng = makeRng(42);

export const ZONES: string[] = ["เขตกรุงเทพฯ", "เขตภาคกลาง", "เขตภาคเหนือ", "เขตภาคใต้"];

export const BRANCHES: Branch[] = [
  { id: "B01", code: "NKR-01", name: "สาขาหลังเดอะมอลล์", zone: ZONES[0], province: "นครราชสีมา", status: "เปิดใช้งาน" },
  { id: "B02", code: "NKR-02", name: "สาขาบ้านเกาะ", zone: ZONES[0], province: "นครราชสีมา", status: "เปิดใช้งาน" },
  { id: "B03", code: "NKR-03", name: "สาขาหนองไผ่ล้อม", zone: ZONES[0], province: "นครราชสีมา", status: "เปิดใช้งาน" },
  { id: "B04", code: "NKR-04", name: "สาขาปากช่อง", zone: ZONES[1], province: "นครราชสีมา", status: "เปิดใช้งาน" },
];

export const ROLES = [
  "ผู้จัดการสาขา",
  "พนักงานขายร้านส่ง",
  "หัวหน้าสาขา",
  "พนักงานจัดเรียงสินค้า",
  "PC ร้านส่ง",
  "แคชเชียร์",
  "Promote"
];

const INITIAL_EMPLOYEES_DATA: Omit<Employee, "zone">[] = [];

export const EMPLOYEES: Employee[] = [];

export function addMockEmployee(empData: any) {
  const newEmp: Employee = {
    id: empData.id || `EMP-${Date.now()}`,
    code: empData.code || `EMP-${String(EMPLOYEES.length + 1).padStart(4, "0")}`,
    firstName: empData.firstName,
    lastName: empData.lastName,
    nickname: empData.nickname || "",
    role: empData.role,
    branchId: empData.branchId,
    zone: BRANCHES.find(b => b.id === empData.branchId)?.zone || ZONES[0],
    email: empData.email || "",
    phone: empData.phone || "",
    assignments: empData.assignments || [{ branchId: empData.branchId, startDate: new Date().toISOString().slice(0, 10), endDate: null }]
  };
  EMPLOYEES.unshift(newEmp);
  return newEmp;
}

export function syncEmployees(dbEmployees: any[]) {
  if (!dbEmployees || dbEmployees.length === 0) return;
  EMPLOYEES.length = 0;
  dbEmployees.forEach((e) => {
    // Attempt to map DB branch to Mock Branch ID using branch code
    const mockBranch = e.currentBranch 
      ? BRANCHES.find(b => b.code === e.currentBranch.code)
      : undefined;
    const mappedBranchId = mockBranch ? mockBranch.id : e.branchId;

    EMPLOYEES.push({
      id: e.id,
      code: e.code,
      firstName: e.firstName,
      lastName: e.lastName,
      nickname: e.nickname || "",
      role: e.role,
      branchId: mappedBranchId,
      zone: e.zoneName || e.zone || mockBranch?.zone || ZONES[0],
      email: e.email || "",
      phone: e.phone || "",
      assignments: e.assignments && e.assignments.length > 0
        ? e.assignments.map((a: any) => {
            const assignmentMockBranch = a.branch 
              ? BRANCHES.find(b => b.code === a.branch.code)
              : undefined;
            return {
              branchId: assignmentMockBranch ? assignmentMockBranch.id : a.branchId,
              startDate: a.startDate,
              endDate: a.endDate || null,
            };
          })
        : [{ branchId: mappedBranchId, startDate: "2025-01-01", endDate: null }]
    });
  });
}

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
export const TODAY = new Date(2026, 6, 22);

export function employeesAtBranchOnDate(branchId: string, dateStr?: string): Employee[] {
  if (!dateStr) return EMPLOYEES.filter((e) => e.branchId === branchId);
  return EMPLOYEES.filter((e) =>
    e.assignments.some((a) => a.branchId === branchId && dateStr >= a.startDate && (a.endDate === null || dateStr <= a.endDate))
  );
}

export function currentAssignment(employeeId: string) {
  const e = EMPLOYEES.find((x) => x.id === employeeId);
  if (!e) return null;
  return e.assignments.find((a) => a.endDate === null) || e.assignments[e.assignments.length - 1];
}

export const TEMPLATE: AuditTemplate = {
  id: "T01",
  name: "แบบประเมินมาตรฐานสาขา",
  sections: [
    {
      name: "1. การเตรียมความพร้อมก่อนเปิดร้าน",
      items: [
        { id: "I01", name: "การเปิดปิดประตูร้าน (ตรงเวลา 08:50น. )", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I02", name: "การเตรียมเงินทอน ความพร้อมพนักงาน ความพร้อมของสินค้า", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I03", name: "อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "2. การบริการ (สุ่มตรวจกล้อง และหน้าร้านจริง)",
      items: [
        { id: "I04", name: "2.1 ยิ้มแย้มแจ่มใส กล่าวทักท้ายลูกค้า กล่าวขอบคุณลูกค้า", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I05", name: "2.2 สอบถามสมาชิก/สอบถามชื่อน้องหมา น้องแมว", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I06", name: "2.3 แนะนำโปรโมชั่นที่เหมาะสมให้กับลูกค้า", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I07", name: "2.4 รับเงิน แจ้งเงินทอน และแจ้งส่วนลด/นำส่งลูกค้าที่แคชเชียร์", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I08", name: "2.5 ทวนรายการสินค้าที่ลูกค้าซื้อ/นำส่งลูกค้าที่รถ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I09", name: "2.6 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "3. การดูแลสินค้าหน้าร้าน",
      items: [
        { id: "I10", name: "3.1 ไม่ FIFO สินค้า ตรวจพบสินค้า EXP ระหว่างขาย ไม่ได้ดำเนินการแจ้งลง app", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I11", name: "3.4 ป้ายราคาหลัก ป้ายสื่อโปรโมชั่น ป้ายราคาไม่ตรง", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I12", name: "3.5 การนับสินค้าควบคุม (กลุ่มยา)/เพิ่มการเติมสินค้า Top 1-50 ไม่ให้ขาด และไม่เติมสินค้าปะปน", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I13", name: "3.6 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "4. ความสะอาด",
      items: [
        { id: "I14", name: "4.1 ไม่มีฝุ่นที่ตัวสินค้า / เชลฟ์ / ความสะอาดบริเวณร้าน", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I15", name: "อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
      ],
    },
    {
      name: "5. อื่นๆ",
      items: [
        { id: "I16", name: "5.2 การติดตามงาน การตรวจสอบ Checklist ประจำวัน", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I17", name: "5.3 ไม่มีการร้องเรียนจากลูกค้า", maxScore: 10, minScore: 6, requirePhoto: false, requireResponsible: true },
        { id: "I18", name: "5.4 การประสานงาน", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I19", name: "5.5 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
  ],
};

export const ALL_ITEMS: (AuditTemplateItem & { section: string })[] = TEMPLATE.sections.flatMap((s) =>
  s.items.map((i) => ({ ...i, section: s.name }))
);

export function statusFromScore(score: number, max: number): "ผ่าน" | "ต้องปรับปรุง" | "ร้ายแรง" {
  const pct = score / max;
  if (pct >= 0.8) return "ผ่าน";
  if (pct >= 0.6) return "ต้องปรับปรุง";
  return "ร้ายแรง";
}

function buildAudits(): Audit[] {
  const audits: Audit[] = [];
  const today = TODAY;
  let auditN = 1;
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    BRANCHES.forEach((b) => {
      const auditsThisMonth = 1 + Math.floor(rng() * 2);
      for (let k = 0; k < auditsThisMonth; k++) {
        const day = 3 + Math.floor(rng() * 24);
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const dateStr = fmtDate(date);
        const branchBias = b.id === "B04" ? -1.1 : b.id === "B08" ? 0.9 : (rng() - 0.5) * 1.2;
        const items: AuditItemResult[] = ALL_ITEMS.map((it) => {
          const raw = 3.6 + branchBias + (rng() - 0.5) * 1.6;
          const score = Math.max(1, Math.min(it.maxScore, Math.round(raw)));
          const branchEmployees = employeesAtBranchOnDate(b.id, dateStr);
          const respCount = it.requireResponsible ? 1 + Math.floor(rng() * 2) : 0;
          const responsibleIds: string[] = [];
          for (let r = 0; r < respCount; r++) {
            const cand = branchEmployees[Math.floor(rng() * branchEmployees.length)];
            if (cand && !responsibleIds.includes(cand.id)) responsibleIds.push(cand.id);
          }
          return {
            itemId: it.id,
            score,
            note: score <= 2 ? "พบปัญหาต้องแก้ไขโดยเร็ว" : score === 3 ? "ควรปรับปรุงเล็กน้อย" : "",
            photosBefore: it.requirePhoto ? [`before_${it.id}.jpg`] : [],
            photosAfter: it.requirePhoto && score <= 3 ? [`after_${it.id}.jpg`] : [],
            responsibleIds,
            status: statusFromScore(score, it.maxScore),
          };
        });
        audits.push({
          id: `A${String(auditN).padStart(4, "0")}`,
          date: dateStr,
          branchId: b.id,
          templateId: TEMPLATE.id,
          auditor: "คุณอารีย์ ตรวจงาน (Area Manager)",
          gps: "13.7563, 100.5018",
          items,
        });
        auditN++;
      }
    });
  }
  return audits.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const SEED_AUDITS: Audit[] = [];

export function avgScore(items: AuditItemResult[]): number {
  if (!items.length) return 0;
  const max = items.reduce((s, i) => {
    const def = ALL_ITEMS.find((d) => d.id === i.itemId);
    return s + (def ? def.maxScore : 5);
  }, 0);
  const got = items.reduce((s, i) => s + i.score, 0);
  return max ? (got / max) * 5 : 0;
}

export let GLOBAL_DB_BRANCHES: any[] = [];
export function syncBranches(branches: any[]) {
  if (Array.isArray(branches) && branches.length > 0) {
    GLOBAL_DB_BRANCHES = branches;
  }
}

export function isSameBranch(id1?: string | null, target?: any): boolean {
  if (!id1 || !target) return false;
  if (typeof target === "string") {
    if (id1 === target) return true;
    const b1 = BRANCHES.find((b) => b.id === id1 || b.code === id1) || GLOBAL_DB_BRANCHES.find((b) => b.id === id1 || b.code === id1);
    const b2 = BRANCHES.find((b) => b.id === target || b.code === target) || GLOBAL_DB_BRANCHES.find((b) => b.id === target || b.code === target);
    if (b1 && b2 && b1.code === b2.code) return true;
    return false;
  }
  const bId = target.id;
  const bCode = target.code;
  if (id1 === bId || id1 === bCode) return true;
  if (bCode === "NKR-01" && id1 === "B01") return true;
  if (bCode === "NKR-02" && id1 === "B02") return true;
  if (bCode === "NKR-03" && id1 === "B03") return true;
  if (bCode === "NKR-04" && id1 === "B04") return true;
  return false;
}

export function cleanBranchName(name?: string | null): string {
  if (!name) return "";
  return name.replace(/สาขาหลังเดอะมอลโคราช|หลังเดอะมอลโคราช/g, "สาขาหลังเดอะมอลล์");
}

export function branchName(id: string, dbBranches?: any[]): string {
  if (!id) return "";
  const allDb = (dbBranches && dbBranches.length > 0) ? dbBranches : GLOBAL_DB_BRANCHES;
  if (allDb && allDb.length > 0) {
    const foundDb = allDb.find((b) => b.id === id || b.code === id);
    if (foundDb) return cleanBranchName(foundDb.name);
  }
  const found = BRANCHES.find((b) => b.id === id || b.code === id)?.name || id;
  return cleanBranchName(found);
}

export function itemName(id: string): string {
  return ALL_ITEMS.find((i) => i.id === id)?.name || id;
}

export function employeeName(id: string): string {
  const e = EMPLOYEES.find((e) => e.id === id);
  return e ? `${e.firstName} ${e.lastName}` : id;
}

export function getBranchHeadName(branchId?: string): string | null {
  if (!branchId) return null;
  const head = EMPLOYEES.find((e) => isSameBranch(e.branchId, branchId) && e.role === "หัวหน้าสาขา") ||
               EMPLOYEES.find((e) => isSameBranch(e.branchId, branchId) && (e.role === "ผู้จัดการสาขา" || e.role?.includes("ผู้จัดการ")));
  if (head) {
    return `${head.firstName} ${head.lastName} (${head.role})`;
  }
  return null;
}

export function getBranchManagerName(branchId?: string): string | null {
  if (!branchId) return null;
  const manager = EMPLOYEES.find((e) => isSameBranch(e.branchId, branchId) && (e.role === "ผู้จัดการสาขา" || e.role?.includes("ผู้จัดการ")));
  if (manager) {
    return `${manager.firstName} ${manager.lastName} (ผู้จัดการสาขา)`;
  }
  return null;
}

export function getAuditorCandidates() {
  const list = EMPLOYEES.filter(
    (e) => e.role === "หัวหน้าสาขา" || e.role === "ผู้จัดการสาขา"
  ).map((e) => {
    const b = BRANCHES.find((b) => b.id === e.branchId);
    return {
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: e.role,
      branchId: e.branchId,
      branchName: b ? b.name : "",
      displayName: `${e.firstName} ${e.lastName} (${e.role} - ${b ? b.name : ""})`,
    };
  });

  return list.sort((a, b) => {
    if (a.role === "ผู้จัดการสาขา" && b.role !== "ผู้จัดการสาขา") return -1;
    if (a.role !== "ผู้จัดการสาขา" && b.role === "ผู้จัดการสาขา") return 1;
    return a.name.localeCompare(b.name, "th");
  });
}

export function formatAuditorName(auditorStr?: string | null, branchId?: string): string {
  // If branchId is provided and auditorStr is an email or generic, fallback to Head of Branch / Branch Manager
  if (branchId) {
    const headName = getBranchHeadName(branchId);
    if (headName && (!auditorStr || auditorStr.includes("@") || auditorStr === "ผู้ตรวจประเมิน" || auditorStr.includes("mis_01"))) {
      return headName;
    }
  }

  if (!auditorStr) return "ผู้ตรวจประเมิน";
  const s = auditorStr.trim();
  if (!s) return "ผู้ตรวจประเมิน";

  // Check exact admin email/username
  if (s.toLowerCase().includes("mis_01")) {
    return "ผู้ดูแลระบบ (Admin)";
  }

  // Check if matches an employee email in EMPLOYEES
  const empByEmail = EMPLOYEES.find((e) => e.email?.toLowerCase() === s.toLowerCase());
  if (empByEmail) {
    return `${empByEmail.firstName} ${empByEmail.lastName} (${empByEmail.role})`;
  }

  // If contains @, format email prefix cleanly (e.g. winterkim.pm2@gmail.com -> Winterkim PM2)
  if (s.includes("@")) {
    const prefix = s.split("@")[0];
    const parts = prefix.split(/[._-]/).filter(Boolean);
    if (parts.length > 0) {
      return parts
        .map((p) => (p.length <= 3 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
        .join(" ");
    }
  }

  return s;
}

export function formatDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y.length === 4) {
      return `${d}/${m}/${y}`;
    }
  }
  return dateStr;
}
