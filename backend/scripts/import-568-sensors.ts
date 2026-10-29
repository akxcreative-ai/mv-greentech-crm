import fs from 'fs';
import path from 'path';
import { PrismaClient, ItemStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const csvPath = path.join(__dirname, 'data-568.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

  console.log(`Read ${lines.length} lines from ${csvPath}`);
  // Line 0: Header (Category,S.No,Product Code,Product Description)
  const items: Prisma.ItemCreateManyInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split row safely with comma
    const parts = line.split(',');
    if (parts.length < 4) continue;

    const category = parts[0]?.trim() || 'Conventional Sensors';
    // parts[1] is S.No
    const itemCode = parts[2]?.trim();
    // description might contain commas if any, join rest
    const description = parts.slice(3).join(',').trim();

    if (!itemCode || !description) continue;

    items.push({
      itemCode,
      description,
      category,
      supplierCode: 'KJT',
      currency: 'USD',
      unit: 'PCS',
      leadTimeDays: 3,
      status: ItemStatus.ACTIVE,
      standardCost: new Prisma.Decimal(0),
      standardPrice: new Prisma.Decimal(0),
      supplierCost: new Prisma.Decimal(0),
      supplierCurrency: 'USD',
      currentStock: 0,
    });
  }

  console.log(`Parsed ${items.length} items to import.`);

  // 1. Delete old temporary items that start with MVG-IN-
  const deletedOld = await prisma.item.deleteMany({
    where: {
      itemCode: { startsWith: 'MVG-IN-' }
    }
  });
  console.log(`Cleaned up ${deletedOld.count} old temporary items.`);

  // 2. Upsert / CreateMany new 568 items
  const created = await prisma.item.createMany({
    data: items,
    skipDuplicates: true,
  });

  console.log(`Successfully inserted ${created.count} new sensor items!`);

  const totalNow = await prisma.item.count();
  console.log(`Total items now in database: ${totalNow}`);
}

run()
  .catch(e => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
