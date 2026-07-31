import { Audit, AuditTemplate, AuditItemResult } from "./types/audit";

export interface Employee {
  id: string;
  code: string; // e.g. EMP-001
  firstName: string;
  lastName: string;
  nickname?: string | null;
  role: string;
  branchId: string;
  currentBranchId?: string;
  currentBranch?: { name: string };
  branchName?: string;
  zone?: string;
  email?: string | null;
  phone?: string | null;
  assignments?: any[];
  scoreAvg?: number; // Calculated average score
  defectsCount?: number;
  auditCount?: number;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  zoneName?: string;
  zone?: string;
  province?: string;
}

export interface AuditTemplateItem {
  id: string;
  name: string;
  maxScore: number;
  minScore: number; // Score below this is considered "failing/must improve"
  requirePhoto: boolean;
  requireResponsible: boolean;
}

export interface AuditTemplateSection {
  name: string;
  items: AuditTemplateItem[];
}

export const ROLES = ["ผู้จัดการสาขา", "หัวหน้าสาขา", "พนักงาน PC", "แคชเชียร์"];

export function isSameBranch(branchId: string, b: { id: string; code: string }): boolean {
  if (!branchId || !b) return false;
  return branchId === b.id || branchId === b.code;
}

export function cleanBranchName(name: string): string {
  if (!name) return "";
  return name.replace(/^สาขา\s*/, "");
}

export function addMockEmployee(emp: Employee) {
  if (emp && emp.id) {
    _dynamicEmployees.push(emp);
  }
}

export const ZONES = ["เขตกรุงเทพฯ", "เขตภาคกลาง", "เขตภาคเหนือ", "เขตภาคใต้"];

export const BRANCHES: Branch[] = [
  { id: "B01", code: "NKR-01", name: "สาขาหลังเดอะมอลล์", zoneName: ZONES[0], province: "นครราชสีมา" },
  { id: "B02", code: "NKR-02", name: "สาขาบ้านเกาะ", zoneName: ZONES[0], province: "นครราชสีมา" },
  { id: "B03", code: "NKR-03", name: "สาขาหนองไผ่ล้อม", zoneName: ZONES[0], province: "นครราชสีมา" },
  { id: "B04", code: "NKR-04", name: "สาขาปากช่อง", zoneName: ZONES[1], province: "นครราชสีมา" },
];

export const EMPLOYEES: Employee[] = [
  { id: "E01", code: "EMP-001", firstName: "สมชาย", lastName: "ใจดี", nickname: "ชาย", role: "ผู้จัดการสาขา", branchId: "B01" },
  { id: "E02", code: "EMP-002", firstName: "วิภา", lastName: "รักเรียน", nickname: "ภา", role: "ผู้จัดการสาขา", branchId: "B02" },
  { id: "E03", code: "EMP-003", firstName: "ศรุต", lastName: "โพยนอก", nickname: "รุต", role: "ผู้จัดการสาขา", branchId: "B03" },
  { id: "E04", code: "EMP-004", firstName: "เอกพล", lastName: "แสงทอง", nickname: "เอก", role: "ผู้จัดการสาขา", branchId: "B04" },
  { id: "E05", code: "EMP-005", firstName: "จิราพร", lastName: "บุญมี", nickname: "พร", role: "หัวหน้าสาขา", branchId: "B01" },
  { id: "E06", code: "EMP-006", firstName: "ปวีณา", lastName: "พงษ์ไพร", nickname: "ปอ", role: "หัวหน้าสาขา", branchId: "B02" },
  { id: "E07", code: "EMP-007", firstName: "ธนกร", lastName: "วงศ์สกุล", nickname: "กร", role: "หัวหน้าสาขา", branchId: "B03" },
  { id: "E08", code: "EMP-008", firstName: "ปุญญาภรณ์", lastName: "โพธิขาว", nickname: "วรรณ", role: "หัวหน้าสาขา", branchId: "B04" },
  { id: "E09", code: "EMP-009", firstName: "อรรถพล", lastName: "มั่งมี", nickname: "พล", role: "พนักงาน PC", branchId: "B01" },
  { id: "E10", code: "EMP-010", firstName: "กัญญาพัชร", lastName: "เกตุแก้ว", nickname: "กานต์", role: "พนักงาน PC", branchId: "B02" },
  { id: "E11", code: "EMP-011", firstName: "ณัฐวุฒิ", lastName: "อินทะกนก", nickname: "นัท", role: "พนักงาน PC", branchId: "B03" },
  { id: "E12", code: "EMP-012", firstName: "ธนวัฒน์", lastName: "อินทะกนก", nickname: "พิมพ์", role: "พนักงาน PC", branchId: "B04" },
  { id: "E13", code: "EMP-013", firstName: "สุริยา", lastName: "แสงจันทร์", nickname: "ซัน", role: "แคชเชียร์", branchId: "B01" },
  { id: "E14", code: "EMP-014", firstName: "อมรเทพ", lastName: "ท้าวถา", nickname: "รัตน์", role: "แคชเชียร์", branchId: "B02" },
  { id: "E15", code: "EMP-015", firstName: "ณัฐสุตา", lastName: "ไผ่ทอง", nickname: "ทิป", role: "แคชเชียร์", branchId: "B03" },
];

/** Dynamic Employees list sync helper */
let _dynamicEmployees: Employee[] = [...EMPLOYEES];
export function syncEmployees(newEmps: Employee[]) {
  if (Array.isArray(newEmps) && newEmps.length > 0) {
    _dynamicEmployees = newEmps;
  }
}
export function getEmployeesList(): Employee[] {
  return _dynamicEmployees;
}

/** Dynamic Branches list sync helper */
let _dynamicBranches: Branch[] = [...BRANCHES];
export function syncBranches(newBranches: Branch[]) {
  if (Array.isArray(newBranches) && newBranches.length > 0) {
    _dynamicBranches = newBranches;
  }
}

export const TEMPLATE: AuditTemplate = {
  id: "T01",
  name: "แบบตรวจประเมินสาขาประจำวัน",
  sections: [
    {
      name: "1. การเตรียมความพร้อมก่อนเปิดร้าน",
      items: [
        { id: "I01", name: "1.1 การเปิดปิดประตูร้าน (ตรงเวลา 08:50น. )", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I02", name: "1.2 การเตรียมเงินทอน ความพร้อมพนักงาน ความพร้อมของสินค้า", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I03", name: "1.3 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "2. การบริการ (สุ่มตรวจกล้อง และหน้าร้านจริง)",
      items: [
        { id: "I04", name: "2.1 ยิ้มแย้มแจ่มใส กล่าวทักทายลูกค้า กล่าวขอบคุณลูกค้า", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I05", name: "2.2 ถามเบอร์สมาชิก และถามชื่อสัตว์เลี้ยง เพื่อบันทึกประวัติการซื้อทุกครั้ง", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I06", name: "2.3 แนะนำโปรโมชั่นประจำเดือนได้อย่างถูกต้องแม่นยำ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I07", name: "2.4 การทวนยอดรับเงิน ยอดเงินทอน ยอดส่วนลด และการส่งมอบใบเสร็จ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I08", name: "2.5 ทวนรายการสินค้าในถุงร่วมกับลูกค้าก่อนส่งมอบ และการช่วยนำส่งสินค้าที่รถลูกค้า", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I09", name: "2.6 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "3. การดูแลสินค้าหน้าร้าน",
      items: [
        { id: "I10", name: "3.1 ไม่ FIFO สินค้า ตรวจพบสินค้า EXP ระหว่างขาย ไม่ได้ดำเนินการแจ้งลง app", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I11", name: "3.2 ป้ายราคาหลัก ป้ายสื่อโปรโมชั่น ป้ายราคาไม่ตรง", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I12", name: "3.3 การนับสินค้าควบคุม (กลุ่มยา)/เพิ่มการเติมสินค้า Top 1-50 ไม่ให้ขาด และไม่เติมสินค้าปะปน", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I13", name: "3.4 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "4. ความสะอาด",
      items: [
        { id: "I14", name: "4.1 ไม่มีฝุ่นที่ตัวสินค้า / เชลฟ์ / ความสะอาดบริเวณร้าน", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I15", name: "4.2 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
      ],
    },
    {
      name: "5. อื่นๆ",
      items: [
        { id: "I16", name: "5.1 การประสานงาน/การติดตามงาน การตรวจสอบ Checklist ประจำวัน", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I17", name: "5.2 ไม่มีการร้องเรียนจากลูกค้า", maxScore: 10, minScore: 6, requirePhoto: false, requireResponsible: true },
        { id: "I18", name: "5.3 การทดสอบความรู้เเละความเข้าใจโปรดักและโปรโมชั่น", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I19", name: "5.4 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "6. การตรวจพบปัญหาที่ต้องแก้ไข",
      items: [
        { id: "I20", name: "6.1 การตรวจพบปัญหาที่ต้องแก้ไข", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I21", name: "6.2 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
      ],
    },
  ],
};

export const ALL_ITEMS: (AuditTemplateItem & { section: string })[] = TEMPLATE.sections.flatMap((s) =>
  s.items.map((i) => ({ ...i, section: s.name }))
);

// Format auditor name nicely
export function formatAuditorName(name?: string, branchId?: string): string {
  if (!name || name === "admin") {
    if (branchId) {
      const match = EMPLOYEES.find(
        (e) => (e.branchId === branchId || e.currentBranchId === branchId) && (e.role?.includes("ผู้จัดการ") || e.role === "หัวหน้าสาขา")
      );
      if (match) return `${match.firstName} ${match.lastName} (${match.role})`;
    }
    return "ศรุต โพยนอก (ผู้จัดการสาขา)";
  }
  return name;
}

export function getBranchHeadName(branchId: string): string {
  const match = EMPLOYEES.find(
    (e) => (e.branchId === branchId || e.currentBranchId === branchId) && (e.role?.includes("ผู้จัดการ") || e.role === "หัวหน้าสาขา")
  );
  return match ? `${match.firstName} ${match.lastName} (${match.role})` : "ศรุต โพยนอก (ผู้จัดการสาขา)";
}

export function getAuditorCandidates(branchId?: string) {
  const candidates = EMPLOYEES.filter(
    (e) => e.role === "หัวหน้าสาขา" || e.role === "ผู้จัดการสาขา" || e.role?.includes("ผู้จัดการ") || e.role?.includes("หัวหน้า")
  ).map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    role: e.role,
    branchId: e.branchId,
    displayName: `${e.firstName} ${e.lastName} — ${e.role} (${BRANCHES.find((b) => b.id === e.branchId)?.name || e.branchId})`,
  }));

  if (branchId) {
    candidates.sort((a, b) => (a.branchId === branchId ? -1 : b.branchId === branchId ? 1 : 0));
  }
  return candidates;
}

export function formatDateDDMMYYYY(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("T")[0].split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function employeesAtBranchOnDate(branchId: string, date: string): Employee[] {
  const list = _dynamicEmployees.filter((e) => e.branchId === branchId || e.currentBranchId === branchId);
  if (list.length > 0) return list;
  return EMPLOYEES.filter((e) => e.branchId === branchId || e.currentBranchId === branchId);
}

export function branchName(branchId: string): string {
  const found = _dynamicBranches.find((b) => b.id === branchId || b.code === branchId);
  if (found) return found.name;
  const staticFound = BRANCHES.find((b) => b.id === branchId || b.code === branchId);
  return staticFound ? staticFound.name : branchId;
}

export function itemName(itemId: string): string {
  const found = ALL_ITEMS.find((i) => i.id === itemId || i.name === itemId);
  return found ? found.name : itemId;
}

export function employeeName(employeeId: string): string {
  const found = _dynamicEmployees.find((e) => e.id === employeeId || e.code === employeeId);
  if (found) return `${found.firstName} ${found.lastName}`;
  const staticFound = EMPLOYEES.find((e) => e.id === employeeId || e.code === employeeId);
  return staticFound ? `${staticFound.firstName} ${staticFound.lastName}` : employeeId;
}

export function avgScore(items: AuditItemResult[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, i) => acc + i.score, 0);
  return Number((sum / items.length).toFixed(2));
}

export function statusFromScore(score: number, max: number = 5): "ผ่าน" | "ต้องปรับปรุง" | "ร้ายแรง" {
  const pct = score / max;
  if (pct >= 0.8) return "ผ่าน";
  if (pct >= 0.6) return "ต้องปรับปรุง";
  return "ร้ายแรง";
}

// Generate initial mock audits
export const INITIAL_AUDITS: Audit[] = [
  {
    id: "A-1785298000037",
    date: "2026-07-29",
    branchId: "B02",
    templateId: "T01",
    auditor: "ศรุต โพยนอก (ผู้จัดการสาขา)",
    gps: "14.9754, 102.0982",
    items: [
      { itemId: "I01", score: 1, status: "ร้ายแรง", note: "เปิดร้านล่าช้า 15 นาที ประตูกะเช้าเปิด 09:05น.", photosBefore: ["photo-0"], photosAfter: [], responsibleIds: ["E14"] },
      { itemId: "I02", score: 1, status: "ร้ายแรง", note: "เงินทอนไม่ครบ ขาด 500 บาท", photosBefore: ["photo-0"], photosAfter: [], responsibleIds: ["E08"] },
      { itemId: "I04", score: 1, status: "ร้ายแรง", note: "พนักงานไม่ทักทายลูกค้า", photosBefore: [], photosAfter: [], responsibleIds: ["E12"] },
      { itemId: "I10", score: 0, status: "ร้ายแรง", note: "พบสินค้าหมดอายุบนชั้นวาง 3 รายการไม่ได้สแกนตัดจ่าย", photosBefore: ["photo-1"], photosAfter: [], responsibleIds: ["E10"] },
      { itemId: "I11", score: 1, status: "ร้ายแรง", note: "ป้ายราคาไม่ตรงกับ POS", photosBefore: [], photosAfter: [], responsibleIds: ["E10"] },
      { itemId: "I14", score: 1, status: "ร้ายแรง", note: "ฝุ่นจับเชลฟ์สินค้ากลุ่มอาหารแมว", photosBefore: [], photosAfter: [], responsibleIds: ["E14"] },
      { itemId: "I20", score: 1, status: "ร้ายแรง", note: "พบสินค้าชำรุดเสียหายบริเวณหลังร้าน", reportText: "ดำเนินการแยกสินค้าชำรุดและแจ้งเคลมซัพพลายเออร์", startDate: "2026-07-29", completedDate: "2026-07-30", photosBefore: ["photo-defect-01"], photosAfter: [], responsibleIds: ["E14"] },
    ],
  },
  {
    id: "A-1785297487021",
    date: "2026-07-29",
    branchId: "B02",
    templateId: "T01",
    auditor: "ศรุต โพยนอก (ผู้จัดการสาขา)",
    gps: "14.9754, 102.0982",
    items: ALL_ITEMS.map((item) => ({
      itemId: item.id,
      score: item.id === "I10" ? 3 : 5,
      status: item.id === "I10" ? "ต้องปรับปรุง" : "ผ่าน",
      note: item.id === "I10" ? "จัดสินค้าแบบ FIFO ไม่เรียบร้อย" : "",
      photosBefore: [],
      photosAfter: [],
      responsibleIds: item.id === "I10" ? ["E10"] : [],
    })),
  },
  {
    id: "A-1785297013976",
    date: "2026-07-29",
    branchId: "B04",
    templateId: "T01",
    auditor: "ศรุต โพยนอก (ผู้จัดการสาขา)",
    gps: "14.7082, 101.4172",
    items: ALL_ITEMS.map((item) => ({
      itemId: item.id,
      score: 5,
      status: "ผ่าน",
      note: "",
      photosBefore: [],
      photosAfter: [],
      responsibleIds: [],
    })),
  },
  {
    id: "A-1785296006897",
    date: "2026-07-29",
    branchId: "B03",
    templateId: "T01",
    auditor: "ศรุต โพยนอก (ผู้จัดการสาขา)",
    gps: "14.9602, 102.0834",
    items: ALL_ITEMS.map((item) => ({
      itemId: item.id,
      score: 5,
      status: "ผ่าน",
      note: "",
      photosBefore: [],
      photosAfter: [],
      responsibleIds: [],
    })),
  },
  {
    id: "A-1785294623986",
    date: "2026-07-29",
    branchId: "B01",
    templateId: "T01",
    auditor: "ศรุต โพยนอก (ผู้จัดการสาขา)",
    gps: "14.9812, 102.1054",
    items: ALL_ITEMS.map((item) => ({
      itemId: item.id,
      score: 5,
      status: "ผ่าน",
      note: "",
      photosBefore: [],
      photosAfter: [],
      responsibleIds: [],
    })),
  },
  {
    id: "A-1784949066602",
    date: "2026-07-25",
    branchId: "B01",
    templateId: "T01",
    auditor: "ปุญญาภรณ์ โพธิขาว (หัวหน้าสาขา)",
    gps: "14.9812, 102.1054",
    items: ALL_ITEMS.map((item) => ({
      itemId: item.id,
      score: 5,
      status: "ผ่าน",
      note: "",
      photosBefore: [],
      photosAfter: [],
      responsibleIds: [],
    })),
  },
];
