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

const INITIAL_EMPLOYEES_DATA: Omit<Employee, "zone">[] = [
  // B01: สาขาหลังเดอะมอลล์
  { id: "EMP-0001", code: "EMP-0001", firstName: "สมชาย", lastName: "ใจดี", nickname: "ชาย", role: "ผู้จัดการสาขา", branchId: "B01", email: "somchai.j@company.co.th", phone: "081-234-5678", assignments: [{ branchId: "B01", startDate: "2025-01-01", endDate: null }] },
  { id: "EMP-0002", code: "EMP-0002", firstName: "วิภา", lastName: "ศรีสุข", nickname: "ภา", role: "หัวหน้าสาขา", branchId: "B01", email: "wipa.s@company.co.th", phone: "082-345-6789", assignments: [{ branchId: "B01", startDate: "2025-01-01", endDate: null }] },
  { id: "EMP-0003", code: "EMP-0003", firstName: "ศรุต", lastName: "แสงทอง", nickname: "รุต", role: "พนักงานจัดเรียงสินค้า", branchId: "B01", email: "sarut.s@company.co.th", phone: "083-456-7890", assignments: [{ branchId: "B01", startDate: "2025-02-15", endDate: null }] },
  { id: "EMP-0004", code: "EMP-0004", firstName: "เอกพล", lastName: "บุญมี", nickname: "เอก", role: "แคชเชียร์", branchId: "B01", email: "akapol.b@company.co.th", phone: "084-567-8901", assignments: [{ branchId: "B01", startDate: "2025-03-01", endDate: null }] },
  { id: "EMP-0005", code: "EMP-0005", firstName: "จิราพร", lastName: "พงษ์ไพร", nickname: "พร", role: "พนักงานขายร้านส่ง", branchId: "B01", email: "jiraporn.p@company.co.th", phone: "085-678-9012", assignments: [{ branchId: "B01", startDate: "2025-04-10", endDate: null }] },

  // B02: สาขาบ้านเกาะ
  { id: "EMP-0006", code: "EMP-0006", firstName: "ปวีณา", lastName: "วงศ์สกุล", nickname: "ปอ", role: "ผู้จัดการสาขา", branchId: "B02", email: "paweena.w@company.co.th", phone: "086-789-0123", assignments: [{ branchId: "B02", startDate: "2025-01-01", endDate: null }] },
  { id: "EMP-0007", code: "EMP-0007", firstName: "ธนกร", lastName: "เจริญพร", nickname: "กร", role: "หัวหน้าสาขา", branchId: "B02", email: "thanakorn.c@company.co.th", phone: "087-890-1234", assignments: [{ branchId: "B02", startDate: "2025-01-15", endDate: null }] },
  { id: "EMP-0008", code: "EMP-0008", firstName: "นภัสวรรณ", lastName: "มั่งมี", nickname: "วรรณ", role: "แคชเชียร์", branchId: "B02", email: "napassawan.m@company.co.th", phone: "088-901-2345", assignments: [{ branchId: "B02", startDate: "2025-02-01", endDate: null }] },
  { id: "EMP-0009", code: "EMP-0009", firstName: "อรรถพล", lastName: "เกตุแก้ว", nickname: "พล", role: "พนักงานจัดเรียงสินค้า", branchId: "B02", email: "atthapol.k@company.co.th", phone: "089-012-3456", assignments: [{ branchId: "B02", startDate: "2025-03-15", endDate: null }] },

  // B03: สาขาหนองไผ่ล้อม
  { id: "EMP-0010", code: "EMP-0010", firstName: "กัญญาพัชร", lastName: "ศรีสุข", nickname: "กานต์", role: "ผู้จัดการสาขา", branchId: "B03", email: "kanyapat.s@company.co.th", phone: "081-111-2222", assignments: [{ branchId: "B03", startDate: "2025-01-01", endDate: null }] },
  { id: "EMP-0011", code: "EMP-0011", firstName: "ณัฐวุฒิ", lastName: "บุญมี", nickname: "นัท", role: "หัวหน้าสาขา", branchId: "B03", email: "nattawut.b@company.co.th", phone: "082-222-3333", assignments: [{ branchId: "B03", startDate: "2025-02-01", endDate: null }] },
  { id: "EMP-0012", code: "EMP-0012", firstName: "พิมพ์ชนก", lastName: "แสงทอง", nickname: "พิมพ์", role: "แคชเชียร์", branchId: "B03", email: "pimchanok.s@company.co.th", phone: "083-333-4444", assignments: [{ branchId: "B03", startDate: "2025-03-01", endDate: null }] },
  { id: "EMP-0013", code: "EMP-0013", firstName: "สุริยา", lastName: "พงษ์ไพร", nickname: "ซัน", role: "พนักงานจัดเรียงสินค้า", branchId: "B03", email: "suriya.p@company.co.th", phone: "084-444-5555", assignments: [{ branchId: "B03", startDate: "2025-04-01", endDate: null }] },

  // B04: สาขาปากช่อง
  { id: "EMP-0014", code: "EMP-0014", firstName: "รัตนาภรณ์", lastName: "เจริญพร", nickname: "รัตน์", role: "ผู้จัดการสาขา", branchId: "B04", email: "rattanaporn.c@company.co.th", phone: "085-555-6666", assignments: [{ branchId: "B04", startDate: "2025-01-01", endDate: null }] },
  { id: "EMP-0015", code: "EMP-0015", firstName: "ชนาธิป", lastName: "วงศ์สกุล", nickname: "ทิป", role: "หัวหน้าสาขา", branchId: "B04", email: "chanathip.w@company.co.th", phone: "086-666-7777", assignments: [{ branchId: "B04", startDate: "2025-01-15", endDate: null }] },
  { id: "EMP-0016", code: "EMP-0016", firstName: "ธนวัตร", lastName: "มีสุข", nickname: "วัตร", role: "พนักงานจัดเรียงสินค้า", branchId: "B04", email: "thanawat.m@company.co.th", phone: "087-777-8888", assignments: [{ branchId: "B04", startDate: "2025-02-01", endDate: null }] },
  { id: "EMP-0017", code: "EMP-0017", firstName: "อนุชา", lastName: "ใจดี", nickname: "ชา", role: "แคชเชียร์", branchId: "B04", email: "anucha.j@company.co.th", phone: "088-888-9999", assignments: [{ branchId: "B04", startDate: "2025-03-01", endDate: null }] },
];

export const EMPLOYEES: Employee[] = INITIAL_EMPLOYEES_DATA.map(e => ({
  ...e,
  zone: BRANCHES.find(b => b.id === e.branchId)?.zone || ZONES[0]
}));

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
        { id: "I05", name: "2.2 สอบถามสมาชิก", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I06", name: "2.3 แนะนำโปรโมชั่นที่เหมาะสมให้กับลูกค้า", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I07", name: "2.4 รับเงิน แจ้งเงินทอน และแจ้งส่วนลด", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I08", name: "2.5 ทวนรายการสินค้าที่ลูกค้าซื้อ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
        { id: "I09", name: "2.6 อื่นๆ", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
      ],
    },
    {
      name: "3. การดูแลสินค้าหน้าร้าน",
      items: [
        { id: "I10", name: "3.1 ไม่ FIFO สินค้า ตรวจพบสินค้า EXP ระหว่างขาย ไม่ได้ดำเนินการแจ้งลง app", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I11", name: "3.4 ป้ายราคาหลัก ป้ายสื่อโปรโมชั่น ป้ายราคาไม่ตรง", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
        { id: "I12", name: "3.5 การนับสินค้าควบคุม (กลุ่มยา)", maxScore: 5, minScore: 3, requirePhoto: true, requireResponsible: true },
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
        { id: "I17", name: "5.3 ไม่มีการร้องเรียนจากลูกค้า", maxScore: 5, minScore: 3, requirePhoto: false, requireResponsible: true },
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

export const SEED_AUDITS: Audit[] = buildAudits();

export function avgScore(items: AuditItemResult[]): number {
  if (!items.length) return 0;
  const max = items.reduce((s, i) => {
    const def = ALL_ITEMS.find((d) => d.id === i.itemId);
    return s + (def ? def.maxScore : 5);
  }, 0);
  const got = items.reduce((s, i) => s + i.score, 0);
  return max ? (got / max) * 5 : 0;
}

export function branchName(id: string): string {
  return BRANCHES.find((b) => b.id === id)?.name || id;
}

export function itemName(id: string): string {
  return ALL_ITEMS.find((i) => i.id === id)?.name || id;
}

export function employeeName(id: string): string {
  const e = EMPLOYEES.find((e) => e.id === id);
  return e ? `${e.firstName} ${e.lastName}` : id;
}
