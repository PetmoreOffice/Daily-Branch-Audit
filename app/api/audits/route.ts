import { NextResponse } from "next/server";
import { CreateAuditSchema } from "@/lib/validations/audit";
import { SEED_AUDITS, branchName } from "@/lib/mock-data";
import { sendAuditDefectAlert } from "@/lib/email";

// GET /api/audits
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  let result = SEED_AUDITS;
  if (branchId) {
    result = result.filter((a) => a.branchId === branchId);
  }

  return NextResponse.json({ success: true, audits: result });
}

// POST /api/audits
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateAuditSchema.parse(body);

    const newAudit = {
      id: `A-${Date.now()}`,
      ...validated,
    };

    SEED_AUDITS.unshift(newAudit as any);

    // Check for severe or failing defect items
    const failingItems = validated.items.filter((i) => i.status !== "ผ่าน");

    if (failingItems.length > 0) {
      const bName = branchName(validated.branchId);
      await sendAuditDefectAlert({
        branchName: bName,
        auditorName: validated.auditor,
        auditDate: validated.date,
        failingItemsCount: failingItems.length,
        recipientEmail: "areeya.a@company.co.th",
      });
    }

    return NextResponse.json({ success: true, audit: newAudit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.errors || error.message || "Invalid payload" },
      { status: 400 }
    );
  }
}
