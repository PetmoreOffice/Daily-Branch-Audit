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
  { id: "B01", code: "NKR-01", name: "สาขาหลังเดอะมอลโคราช", zone: ZONES[0], province: "นครราชสีมา", status: "เปิดใช้งาน" },
  { id: "B02", code: "NKR-02", name: "สาขาบ้านเกาะ", zone: ZONES[0], province: "นครราชสีมา", status: "เปิดใช้งาน" },
  { id: "B03", code: "NKR-03", name: "สาขาหนองไผ่ล้อม", zone: ZONES[0], province: "นครราชสีมา", status: "เปิดใช้งาน" },
  { id: "B04", code: "NKR-04", name: "สาขาปากช่อง", zone: ZONES[1], province: "นครราชสีมา", status: "เปิดใช้งาน" },
];

export const ROLES = ["ผู้จัดการสาขา", "หัวหน้าสาขา", "พนักงาน PC", "แคชเชียร์"];

const FIRST_NAMES = ["สมชาย", "วิภา", "ศรุต", "เอกพล", "จิราพร", "ปวีณา", "ธนกร", "นภัสวรรณ", "อรรถพล", "กัญญาพัชร", "ณัฐวุฒิ", "พิมพ์ชนก", "สุริยา", "รัตนาภรณ์", "ชนาธิป"];
const LAST_NAMES = ["ใจดี", "รักเรียน", "ศรีสุข", "แสงทอง", "บุญมี", "พงษ์ไพร", "วงศ์สกุล", "เจริญพร", "มั่งมี", "เกตุแก้ว"];
const NICKNAMES = ["ชาย", "ภา", "รุต", "เอก", "พร", "ปอ", "กร", "วรรณ", "พล", "กานต์", "นัท", "พิมพ์", "ซัน", "รัตน์", "ทิป"];

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }
export const TODAY = new Date(2026, 6, 22);

function buildAssignmentHistory(currentBranchId: string) {
  const rotated = rng() < 0.4;
  if (!rotated) {
    const monthsAgo = 3 + Math.floor(rng() * 24);
    return [{ branchId: currentBranchId, startDate: fmtDate(addMonths(TODAY, -monthsAgo)), endDate: null }];
  }
  let prevBranch: string;
  do { prevBranch = BRANCHES[Math.floor(rng() * BRANCHES.length)].id; } while (prevBranch === currentBranchId);
  const startedMonthsAgo = 14 + Math.floor(rng() * 16);
  const movedMonthsAgo = 1 + Math.floor(rng() * 11);
  const startDate = fmtDate(addMonths(TODAY, -startedMonthsAgo));
  const moveDate = fmtDate(addMonths(TODAY, -movedMonthsAgo));
  return [
    { branchId: prevBranch, startDate, endDate: moveDate },
    { branchId: currentBranchId, startDate: moveDate, endDate: null },
  ];
}

function buildEmployees(): Employee[] {
  const list: Employee[] = [];
  let n = 1;
  BRANCHES.forEach((b) => {
    ROLES.forEach((role) => {
      const count = role === "ผู้จัดการสาขา" ? 1 : role === "รองผู้จัดการ" ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        const nick = NICKNAMES[Math.floor(rng() * NICKNAMES.length)];
        const assignments = buildAssignmentHistory(b.id);
        list.push({
          id: `E${String(n).padStart(3, "0")}`,
          code: `EMP-${String(n).padStart(4, "0")}`,
          firstName: fn,
          lastName: ln,
          nickname: nick,
          role,
          branchId: b.id,
          zone: b.zone,
          email: `${fn}.${ln}@company.co.th`.toLowerCase(),
          phone: `08${Math.floor(rng() * 90000000 + 10000000)}`,
          assignments,
        });
        n++;
      }
    });
  });
  return list;
}
export let EMPLOYEES: Employee[] = buildEmployees();

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
        { id: "I17", name: "5.3 ไม่มีการร้องเรียงจากลูกค้า", maxScore: 10, minScore: 5, requirePhoto: false, requireResponsible: true },
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
