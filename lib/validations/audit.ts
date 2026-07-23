import { z } from "zod";

export const AuditItemAnswerSchema = z.object({
  itemId: z.string().min(1, "กรุณาระบุไอเทม"),
  score: z.number().min(1, "คะแนนต้องไม่น้อยกว่า 1").max(5, "คะแนนต้องไม่เกิน 5"),
  note: z.string().optional().default(""),
  photosBefore: z.array(z.string()).default([]),
  photosAfter: z.array(z.string()).default([]),
  responsibleIds: z.array(z.string()).default([]),
  status: z.enum(["ผ่าน", "ต้องปรับปรุง", "ร้ายแรง"]),
});

export const CreateAuditSchema = z.object({
  date: z.string().min(1, "กรุณาระบุวันที่ตรวจ"),
  branchId: z.string().min(1, "กรุณาเลือกสาขา"),
  templateId: z.string().min(1, "กรุณาเลือกแบบประเมิน"),
  auditor: z.string().min(1, "กรุณาระบุชื่อผู้ตรวจ"),
  gps: z.string().optional().default("-"),
  items: z.array(AuditItemAnswerSchema).min(1, "ต้องมีคำตอบอย่างน้อย 1 รายการ"),
});

export type CreateAuditInput = z.infer<typeof CreateAuditSchema>;
