export interface Zone {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  zone: string;
  province: string;
  status: string;
}

export interface EmployeeAssignment {
  branchId: string;
  startDate: string;
  endDate: string | null;
}

export interface Employee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  role: string;
  branchId: string;
  zone: string;
  email: string;
  phone: string;
  assignments: EmployeeAssignment[];
}

export interface AuditTemplateItem {
  id: string;
  name: string;
  maxScore: number;
  minScore: number;
  requirePhoto: boolean;
  requireResponsible: boolean;
}

export interface AuditTemplateSection {
  name: string;
  items: AuditTemplateItem[];
}

export interface AuditTemplate {
  id: string;
  name: string;
  sections: AuditTemplateSection[];
}

export interface AuditItemResult {
  itemId: string;
  score: number;
  note: string;
  photosBefore: string[];
  photosAfter: string[];
  responsibleIds: string[];
  status: "ผ่าน" | "ต้องปรับปรุง" | "ร้ายแรง";
}

export interface Audit {
  id: string;
  date: string;
  branchId: string;
  templateId: string;
  auditor: string;
  gps: string;
  items: AuditItemResult[];
}

export type UserRole = "admin" | "executive" | "area_manager" | "branch_manager" | "staff";
