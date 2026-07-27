"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Get all employees with their branch and zone
export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        currentBranch: true,
        assignments: {
          include: {
            branch: true,
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    // Transform to match the UI shape
    return employees.map((e) => ({
      ...e,
      zone: e.zoneName,
    }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Failed to fetch employees");
  }
}

// 2. Get all branches (for transfer dropdown)
export async function getBranches() {
  try {
    return await prisma.branch.findMany({
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw new Error("Failed to fetch branches");
  }
}

// 3. Add new employee
export async function addEmployee(data: {
  firstName: string;
  lastName: string;
  nickname: string;
  role: string;
  branchId: string;
  email?: string;
  phone?: string;
}) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
      include: { zone: true }
    });

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Generate next EMP code (naive approach for this example)
    const count = await prisma.employee.count();
    const newCode = `EMP-${String(count + 1).padStart(4, "0")}`;

    const newEmployee = await prisma.employee.create({
      data: {
        code: newCode,
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null,
        branchId: data.branchId,
        zoneName: branch.zone.name,
        assignments: {
          create: {
            branchId: data.branchId,
            startDate: new Date().toISOString().slice(0, 10),
          },
        },
      },
    });

    revalidatePath("/");
    return newEmployee;
  } catch (error) {
    console.error("Error adding employee:", error);
    throw new Error("Failed to add employee");
  }
}

// 4. Transfer employee to new branch
export async function transferEmployee(employeeId: string, newBranchId: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        assignments: {
          where: { endDate: null },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    if (!employee) throw new Error("Employee not found");

    const branch = await prisma.branch.findUnique({
      where: { id: newBranchId },
      include: { zone: true }
    });

    if (!branch) throw new Error("New branch not found");

    // Close current assignment
    if (employee.assignments.length > 0) {
      const currentAssignment = employee.assignments[0];
      await prisma.employeeAssignment.update({
        where: { id: currentAssignment.id },
        data: { endDate: today },
      });
    }

    // Update employee and create new assignment
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        branchId: newBranchId,
        zoneName: branch.zone.name,
        assignments: {
          create: {
            branchId: newBranchId,
            startDate: today,
          },
        },
      },
    });

    revalidatePath("/");
    return updatedEmployee;
  } catch (error) {
    console.error("Error transferring employee:", error);
    throw new Error("Failed to transfer employee");
  }
}

// 5. Update employee details (e.g. adding email/phone/role later)
export async function updateEmployee(employeeId: string, data: {
  email?: string;
  phone?: string;
  role?: string;
}) {
  try {
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.role !== undefined) updateData.role = data.role;

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });

    revalidatePath("/");
    return updatedEmployee;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw new Error("Failed to update employee");
  }
}
