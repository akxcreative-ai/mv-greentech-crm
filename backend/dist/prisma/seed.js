"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- MV GREENTECH CRM Database Seeding Started ---');
    // 1. Seed Admin User
    const adminEmail = 'admin@mvgreentech.com';
    const hashedPassword = await bcryptjs_1.default.hash('Admin@123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: client_1.Role.ADMINISTRATOR,
            isActive: true,
        },
        create: {
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'MV Greentech',
            phone: '+91 9876543210',
            role: client_1.Role.ADMINISTRATOR,
            isActive: true,
        },
    });
    console.log(`✓ Admin user configured: ${adminUser.email} (Role: ${adminUser.role})`);
    // 2. Seed Currencies
    const currenciesData = [
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    ];
    const currencyMap = new Map();
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
        if (!currencyId)
            continue;
        // Check if rate already exists for currency
        const existingRate = await prisma.exchangeRate.findFirst({
            where: { currencyId },
            orderBy: { effectiveDate: 'desc' },
        });
        if (existingRate) {
            await prisma.exchangeRate.update({
                where: { id: existingRate.id },
                data: {
                    toINR: new client_1.Prisma.Decimal(item.rate),
                    effectiveDate: today,
                },
            });
        }
        else {
            await prisma.exchangeRate.create({
                data: {
                    currencyId,
                    toINR: new client_1.Prisma.Decimal(item.rate),
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
