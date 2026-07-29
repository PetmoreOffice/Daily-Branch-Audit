"use server";

import { prisma } from "@/lib/prisma";
import { Audit } from "@/lib/types/audit";
import { TEMPLATE, BRANCHES } from "@/lib/mock-data";

/** Resolve any branch ID format (cuid, code like NKR-01, or mock ID B01) -> DB branchId */
async function getBranchDbId(inputBranchId: string): Promise<string | null> {
  if (!inputBranchId) return null;

  // 1. Directly check by DB CUID
  let dbBranch = await prisma.branch.findUnique({ where: { id: inputBranchId } });
  if (dbBranch) return dbBranch.id;

  // 2. Check by branch code (e.g. NKR-01)
  dbBranch = await prisma.branch.findUnique({ where: { code: inputBranchId } });
  if (dbBranch) return dbBranch.id;

  // 3. Check by mock branch ID (B01, etc.)
  const mockBranch = BRANCHES.find((b) => b.id === inputBranchId || b.code === inputBranchId);
  if (mockBranch) {
    dbBranch = await prisma.branch.findUnique({ where: { code: mockBranch.code } });
    if (dbBranch) return dbBranch.id;
  }

  // 4. Fallback to first branch in DB
  const firstBranch = await prisma.branch.findFirst();
  return firstBranch?.id || null;
}

/** Map DB branchId (cuid) -> mock branchId (B01) */
async function getMockBranchId(dbBranchId: string): Promise<string> {
  if (!dbBranchId) return "";
  const alreadyMock = BRANCHES.find((b) => b.id === dbBranchId || b.code === dbBranchId);
  if (alreadyMock) return alreadyMock.id;
  const dbBranch = await prisma.branch.findUnique({ where: { id: dbBranchId } });
  if (!dbBranch) return dbBranchId;
  const mockBranch = BRANCHES.find((b) => b.code === dbBranch.code);
  return mockBranch ? mockBranch.id : dbBranch.id;
}

/** Module-level cache — avoids re-upserting all sections/items on every saveAudit call */
let _templateCache: { templateId: string; itemIdMap: Record<string, string> } | null = null;

/**
 * Ensures the audit template and all its items exist in the DB.
 * Returns a map of { templateId, itemIdMap: { mockItemId -> dbItemId } }
 * Result is cached for the lifetime of the process.
 */
async function ensureTemplateInDb() {
  if (_templateCache) return _templateCache;

  // Upsert template
  let template = await prisma.auditTemplate.findFirst({ where: { name: TEMPLATE.name } });
  if (!template) {
    template = await prisma.auditTemplate.create({ data: { name: TEMPLATE.name } });
  }

  // Build item map: mockItemId -> dbItem
  const itemIdMap: Record<string, string> = {};

  for (let si = 0; si < TEMPLATE.sections.length; si++) {
    const sec = TEMPLATE.sections[si];

    // Upsert section (find by name + templateId)
    let section = await prisma.auditSection.findFirst({
      where: { templateId: template.id, name: sec.name },
    });
    if (!section) {
      section = await prisma.auditSection.create({
        data: { templateId: template.id, name: sec.name, order: si },
      });
    }

    for (const item of sec.items) {
      // Find item by name + sectionId
      let dbItem = await prisma.auditItem.findFirst({
        where: { sectionId: section.id, name: item.name },
      });
      if (!dbItem) {
        dbItem = await prisma.auditItem.create({
          data: {
            sectionId: section.id,
            name: item.name,
            maxScore: item.maxScore,
            minScore: item.minScore,
            requirePhoto: item.requirePhoto,
            requireResponsible: item.requireResponsible,
          },
        });
      }
      itemIdMap[item.id] = dbItem.id;
    }
  }

  _templateCache = { templateId: template.id, itemIdMap };
  return _templateCache;
}

// Save a new audit to the database
export async function saveAudit(audit: Audit): Promise<string> {
  try {
    // Resolve mock branchId -> DB branchId
    const dbBranchId = await getBranchDbId(audit.branchId);
    if (!dbBranchId) {
      console.warn(`Branch not found for mock ID: ${audit.branchId}, skipping DB save`);
      return audit.id;
    }

    // Ensure template + items exist
    const { templateId, itemIdMap } = await ensureTemplateInDb();

    // Upsert the audit (avoid duplicate on re-submit)
    const existing = await prisma.audit.findUnique({ where: { id: audit.id } });
    if (existing) return audit.id;

    await prisma.audit.create({
      data: {
        id: audit.id,
        date: audit.date,
        branchId: dbBranchId,
        templateId,
        auditor: audit.auditor,
        gps: audit.gps || null,
        items: {
          create: audit.items
            .filter((item) => itemIdMap[item.itemId]) // only items that exist in DB
            .map((item) => ({
              itemId: itemIdMap[item.itemId],
              score: item.score,
              note: item.note || "",
              status: item.status || "ผ่าน",
              photosBefore: item.photosBefore || [],
              photosAfter: item.photosAfter || [],
              responsibleIds: item.responsibleIds || [],
            })),
        },
      },
    });

    return audit.id;
  } catch (error) {
    console.error("Failed to save audit:", error);
    throw error;
  }
}

// Load all audits from the database and map back to Audit shape
export async function getAudits(): Promise<Audit[]> {
  try {
    // Build reverse itemId map: dbItemId -> mockItemId
    const allItems = await prisma.auditItem.findMany({
      include: { section: { include: { template: true } } },
    });

    // Map dbItemId -> section name + item name for matching
    const dbItemMap: Record<string, { sectionName: string; itemName: string }> = {};
    for (const it of allItems) {
      dbItemMap[it.id] = { sectionName: it.section.name, itemName: it.name };
    }

    // Build reverse lookup: sectionName+itemName -> mockItemId
    const mockItemLookup: Record<string, string> = {};
    for (const sec of TEMPLATE.sections) {
      for (const item of sec.items) {
        mockItemLookup[`${sec.name}||${item.name}`] = item.id;
      }
    }

    const audits = await prisma.audit.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // Build a cache of dbBranchId -> mockBranchId
    const branchIdCache: Record<string, string> = {};
    for (const a of audits) {
      if (!branchIdCache[a.branchId]) {
        branchIdCache[a.branchId] = await getMockBranchId(a.branchId);
      }
    }

    return audits.map((a) => ({
      id: a.id,
      date: a.date,
      branchId: branchIdCache[a.branchId] || a.branchId,
      templateId: a.templateId,
      auditor: a.auditor,
      gps: a.gps || "",
      items: a.items.map((item) => {
        const meta = dbItemMap[item.itemId];
        const mockId = meta
          ? (mockItemLookup[`${meta.sectionName}||${meta.itemName}`] || meta.itemName || item.itemId)
          : item.itemId;
        return {
          itemId: mockId,
          score: item.score,
          note: item.note || "",
          status: item.status as "ผ่าน" | "ต้องปรับปรุง" | "ร้ายแรง",
          photosBefore: item.photosBefore || [],
          photosAfter: item.photosAfter || [],
          responsibleIds: item.responsibleIds || [],
        };
      }),
    }));
  } catch (error) {
    console.error("Failed to load audits:", error);
    return [];
  }
}
