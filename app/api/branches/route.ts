import { NextResponse } from "next/server";
import { getBranches } from "@/app/actions/employee";

// GET /api/branches
export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json({ success: true, data: branches, count: branches.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch branches" },
      { status: 500 }
    );
  }
}
