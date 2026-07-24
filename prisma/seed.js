const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ZONES = ["เขตกรุงเทพฯ", "เขตภาคกลาง", "เขตภาคเหนือ", "เขตภาคใต้"];

const BRANCHES = [
  { code: "NKR-01", name: "สาขาหลังเดอะมอลโคราช", zoneName: ZONES[0], province: "นครราชสีมา" },
  { code: "NKR-02", name: "สาขาบ้านเกาะ", zoneName: ZONES[0], province: "นครราชสีมา" },
  { code: "NKR-03", name: "สาขาหนองไผ่ล้อม", zoneName: ZONES[0], province: "นครราชสีมา" },
  { code: "NKR-04", name: "สาขาปากช่อง", zoneName: ZONES[1], province: "นครราชสีมา" },
];

const ROLES = ["ผู้จัดการสาขา", "หัวหน้าสาขา", "พนักงาน PC", "แคชเชียร์"];
const FIRST_NAMES = ["สมชาย", "วิภา", "ศรุต", "เอกพล", "จิราพร", "ปวีณา", "ธนกร", "นภัสวรรณ", "อรรถพล", "กัญญาพัชร", "ณัฐวุฒิ", "พิมพ์ชนก", "สุริยา", "รัตนาภรณ์", "ชนาธิป"];
const LAST_NAMES = ["ใจดี", "รักเรียน", "ศรีสุข", "แสงทอง", "บุญมี", "พงษ์ไพร", "วงศ์สกุล", "เจริญพร", "มั่งมี", "เกตุแก้ว"];
// const NICKNAMES = ["ชาย", "ภา", "รุต", "เอก", "พร", "ปอ", "กร", "วรรณ", "พล", "กานต์", "นัท", "พิมพ์", "ซัน", "รัตน์", "ทิป"];

function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}
const rng = makeRng(42);

async function main() {
  console.log("Seeding database...");

  // 1. Create Zones
  const zoneMap = {};
  for (const zName of ZONES) {
    const zone = await prisma.zone.upsert({
      where: { name: zName },
      update: {},
      create: { name: zName },
    });
    zoneMap[zName] = zone.id;
  }

  // 2. Create Branches
  const branchMap = {};
  for (const b of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: {
        code: b.code,
        name: b.name,
        province: b.province,
        zoneId: zoneMap[b.zoneName],
        status: "เปิดใช้งาน",
      },
    });
    branchMap[b.code] = branch.id;
  }

  // 3. Create Employees
  let empN = 1;
  for (const b of BRANCHES) {
    for (const role of ROLES) {
      const count = role === "ผู้จัดการสาขา" ? 1 : role === "หัวหน้าสาขา" ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        const code = `EMP-${String(empN).padStart(4, "0")}`;

        const employee = await prisma.employee.upsert({
          where: { code },
          update: {},
          create: {
            code,
            firstName: fn,
            lastName: ln,
            role,
            email: `${fn}.${ln}.${empN}@company.co.th`.toLowerCase(),
            phone: `08${Math.floor(rng() * 90000000 + 10000000)}`,
            branchId: branchMap[b.code],
            zoneName: b.zoneName,
          },
        });

        // Create assignment record
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        
        // check if assignment already exists
        const existingAssignment = await prisma.employeeAssignment.findFirst({
            where: { employeeId: employee.id }
        });

        if (!existingAssignment) {
            await prisma.employeeAssignment.create({
                data: {
                  employeeId: employee.id,
                  branchId: branchMap[b.code],
                  startDate: dateStr,
                }
              });
        }

        empN++;
      }
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
