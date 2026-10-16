import { PrismaClient, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- MV GREENTECH CRM Database Seeding Started ---');

  // 1. Seed Master Users (Director, Admin, Sales Head)
  const defaultPassword = await bcrypt.hash('Admin@123', 10);
  const salesPassword = await bcrypt.hash('Sales@123', 10);

  const usersToSeed = [
    {
      email: 'director@mvgreentech.com',
      password: defaultPassword,
      firstName: 'Managing',
      lastName: 'Director',
      phone: '+91 9876543200',
      role: Role.DIRECTOR,
    },
    {
      email: 'admin@mvgreentech.com',
      password: defaultPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+91 9876543210',
      role: Role.ADMINISTRATOR,
    },
    {
      email: 'saleshead@mvgreentech.com',
      password: salesPassword,
      firstName: 'Sales',
      lastName: 'Head',
      phone: '+91 9876543220',
      role: Role.SALES_HEAD,
    },
  ];

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isActive: true },
      create: { ...u, isActive: true },
    });
    console.log(`✓ Master user configured: ${user.email} (Role: ${user.role})`);
  }

  // 2. Seed Currencies
  const currenciesData = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  ];

  const currencyMap = new Map<string, string>();

  for (const c of currenciesData) {
    const currency = await prisma.currency.upsert({
      where: { code: c.code },
      update: { name: c.name, symbol: c.symbol },
      create: c,
    });
    currencyMap.set(c.code, currency.id);
    console.log(`✓ Currency configured: ${currency.code} (${currency.symbol})`);
  }

  // 3. Seed Exchange Rates to INR
  const exchangeRatesData = [
    { code: 'INR', rate: 1.0 },
    { code: 'USD', rate: 83.5 },
    { code: 'EUR', rate: 91.2 },
    { code: 'CNY', rate: 11.5 },
  ];

  const today = new Date();

  for (const item of exchangeRatesData) {
    const currencyId = currencyMap.get(item.code);
    if (!currencyId) continue;

    // Check if rate already exists for currency
    const existingRate = await prisma.exchangeRate.findFirst({
      where: { currencyId },
      orderBy: { effectiveDate: 'desc' },
    });

    if (existingRate) {
      await prisma.exchangeRate.update({
        where: { id: existingRate.id },
        data: {
          toINR: new Prisma.Decimal(item.rate),
          effectiveDate: today,
        },
      });
    } else {
      await prisma.exchangeRate.create({
        data: {
          currencyId,
          toINR: new Prisma.Decimal(item.rate),
          effectiveDate: today,
        },
      });
    }
    console.log(`✓ Exchange rate configured: 1 ${item.code} = ${item.rate} INR`);
  }

  // 4. Seed Settings
  const settingsData = [
    { key: 'leadVisibility', value: 'assigned_only' },
    { key: 'companyName', value: 'MV GREENTECH PVT LTD' },
    { key: 'defaultCurrency', value: 'INR' },
    { key: 'quotationValidityDays', value: 30 },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
    console.log(`✓ Setting configured: ${s.key} = ${JSON.stringify(s.value)}`);
  }

  console.log('--- MV GREENTECH CRM Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
