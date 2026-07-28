import { NextResponse } from "next/server";
import { getEmployees } from "@/app/actions/employee";

// GET /api/employees
export async function GET() {
  try {
    const employees = await getEmployees();
    return NextResponse.json({ success: true, data: employees, count: employees.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
