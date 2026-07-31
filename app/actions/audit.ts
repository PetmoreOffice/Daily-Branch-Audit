"use server";

import { prisma } from "@/lib/prisma";
import { Audit } from "@/lib/types/audit";
import { TEMPLATE, BRANCHES, ALL_ITEMS } from "@/lib/mock-data";

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

function getItemKeyword(itemId: string): string[] {
  switch (itemId) {
    case "I01": return ["ประตู", "เปิดปิด"];
    case "I02": return ["เงินทอน", "ความพร้อม"];
    case "I03": return ["อื่นๆ"];
    case "I04": return ["ยิ้ม", "ทักทาย"];
    case "I05": return ["สมาชิก", "หมา", "แมว"];
    case "I06": return ["โปรโมชั่น"];
    case "I07": return ["รับเงิน", "ส่วนลด"];
    case "I08": return ["ทวนรายการ", "นำส่งลูกค้า"];
    case "I09": return ["อื่นๆ"];
    case "I10": return ["fifo", "exp"];
    case "I11": return ["ป้ายราคา", "สื่อโปรโมชั่น"];
    case "I12": return ["กลุ่มยา", "top 1-50", "สินค้าควบคุม"];
    case "I13": return ["อื่นๆ"];
    case "I14": return ["ฝุ่น", "เชลฟ์", "ความสะอาด"];
    case "I15": return ["อื่นๆ"];
    case "I16": return ["ติดตามงาน", "checklist"];
    case "I17": return ["ร้องเรียน"];
    case "I18": return ["ประสานงาน"];
    case "I19": return ["อื่นๆ"];
    default: return [];
  }
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

    // Pre-fetch ALL items in this section in a single query
    const existingSectionItems = await prisma.auditItem.findMany({ where: { sectionId: section.id } });
    const itemsByName = Object.fromEntries(existingSectionItems.map((i) => [i.name, i]));

    // Process each template item, creating/updating only as needed
    const toCreate: typeof sec.items = [];
    const toUpdate: { id: string; data: Parameters<typeof prisma.auditItem.update>[0]["data"] }[] = [];

    for (const item of sec.items) {
      const existingByName = itemsByName[item.name];

      if (existingByName) {
        // Update scores if changed
        if (existingByName.maxScore !== item.maxScore || existingByName.minScore !== item.minScore) {
          toUpdate.push({ id: existingByName.id, data: { maxScore: item.maxScore, minScore: item.minScore } });
        }
        itemIdMap[item.id] = existingByName.id;
      } else {
        // Check keyword fallback using already-fetched items
        const keywords = getItemKeyword(item.id);
        const matchByKeyword = existingSectionItems.find((it) =>
          keywords.some((kw) => it.name.toLowerCase().includes(kw))
        ) || null;

        if (matchByKeyword) {
          toUpdate.push({
            id: matchByKeyword.id,
            data: {
              name: item.name,
              maxScore: item.maxScore,
              minScore: item.minScore,
              requirePhoto: item.requirePhoto,
              requireResponsible: item.requireResponsible,
            },
          });
          itemIdMap[item.id] = matchByKeyword.id;
        } else {
          toCreate.push(item);
        }
      }
    }

    // Batch create new items
    for (const item of toCreate) {
      const dbItem = await prisma.auditItem.create({
        data: {
          sectionId: section.id,
          name: item.name,
          maxScore: item.maxScore,
          minScore: item.minScore,
          requirePhoto: item.requirePhoto,
          requireResponsible: item.requireResponsible,
        },
      });
      itemIdMap[item.id] = dbItem.id;
    }

    // Batch update changed items
    await Promise.all(
      toUpdate.map((u) => prisma.auditItem.update({ where: { id: u.id }, data: u.data }))
    );
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
      take: 200, // Limit to last 200 audits for performance
    });

    // Build branchId -> mockBranchId cache using a single DB query
    const uniqueDbBranchIds = [...new Set(audits.map((a) => a.branchId))];
    const dbBranchesForAudits = uniqueDbBranchIds.length > 0
      ? await prisma.branch.findMany({ where: { id: { in: uniqueDbBranchIds } } })
      : [];
    const dbBranchCodeMap = Object.fromEntries(dbBranchesForAudits.map((b) => [b.id, b.code]));

    const branchIdCache: Record<string, string> = {};
    for (const dbBranchId of uniqueDbBranchIds) {
      const code = dbBranchCodeMap[dbBranchId];
      const mockBranch = BRANCHES.find((b) => b.code === code || b.id === dbBranchId);
      branchIdCache[dbBranchId] = mockBranch ? mockBranch.id : dbBranchId;
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
        let mockId = item.itemId;

        if (meta) {
          const directMatch = mockItemLookup[`${meta.sectionName}||${meta.itemName}`];
          if (directMatch) {
            mockId = directMatch;
          } else {
            // Keyword fallback for resilient matching when template item names change
            const secItems = ALL_ITEMS.filter(
              (i: any) => i.section === meta.sectionName || meta.sectionName.startsWith(i.section.slice(0, 2))
            );
            const nameLower = meta.itemName.toLowerCase();
            const matched = secItems.find((i: any) => {
              const kws = getItemKeyword(i.id);
              return kws.some((kw) => nameLower.includes(kw));
            });
            mockId = matched ? matched.id : (meta.itemName || item.itemId);
          }
        }

        return {
          itemId: mockId,
          score: item.score,
          note: item.note || "",
          reportText: item.reportText || "",
          startDate: item.startDate || "",
          completedDate: item.completedDate || "",
          isResolved: item.isResolved || false,
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
