"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
const itemStatusEnum = zod_1.z.enum(['ACTIVE', 'DISCONTINUED', 'SUPERSEDED']);
const createItemSchema = zod_1.z.object({
    itemCode: zod_1.z.string().min(1, 'Item code is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    category: zod_1.z.string().optional().nullable(),
    imageUrl: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().optional().default('PCS'),
    standardCost: zod_1.z.number().or(zod_1.z.string()).optional().nullable(),
    standardPrice: zod_1.z.number().or(zod_1.z.string()).optional().nullable(),
    currency: zod_1.z.string().optional().default('INR'),
    ppq: zod_1.z.string().optional().nullable(),
    currentStock: zod_1.z.number().int().optional().default(0),
    leadTimeDays: zod_1.z.number().int().optional().nullable(),
    supplierCode: zod_1.z.string().optional().nullable(),
    supplierCurrency: zod_1.z.string().optional().nullable(),
    supplierCost: zod_1.z.number().or(zod_1.z.string()).optional().nullable(),
    status: itemStatusEnum.optional().default('ACTIVE'),
});
const updateItemSchema = zod_1.z.object({
    itemCode: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().optional().nullable(),
    imageUrl: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().optional().nullable(),
    standardCost: zod_1.z.number().or(zod_1.z.string()).optional().nullable(),
    standardPrice: zod_1.z.number().or(zod_1.z.string()).optional().nullable(),
    currency: zod_1.z.string().optional(),
    ppq: zod_1.z.string().optional().nullable(),
    currentStock: zod_1.z.number().int().optional().nullable(),
    leadTimeDays: zod_1.z.number().int().optional().nullable(),
    supplierCode: zod_1.z.string().optional().nullable(),
    supplierCurrency: zod_1.z.string().optional().nullable(),
    supplierCost: zod_1.z.number().or(zod_1.z.string()).optional().nullable(),
    status: itemStatusEnum.optional(),
});
// GET /export/csv - Export items as CSV (Must be before /:id)
router.get('/export/csv', async (_req, res, next) => {
    try {
        const items = await prisma_1.prisma.item.findMany({
            orderBy: { itemCode: 'asc' },
        });
        const headers = [
            'Item Code',
            'Description',
            'Unit',
            'Standard Cost',
            'Standard Price',
            'Currency',
            'Current Stock',
            'Lead Time (Days)',
            'Supplier Code',
            'Status',
        ];
        const escapeCsv = (val) => {
            if (val === null || val === undefined)
                return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };
        const rows = items.map((i) => [
            escapeCsv(i.itemCode),
            escapeCsv(i.description),
            escapeCsv(i.unit),
            escapeCsv(i.standardCost ? i.standardCost.toString() : '0.00'),
            escapeCsv(i.standardPrice ? i.standardPrice.toString() : '0.00'),
            escapeCsv(i.currency),
            escapeCsv(i.currentStock ?? 0),
            escapeCsv(i.leadTimeDays ?? ''),
            escapeCsv(i.supplierCode),
            escapeCsv(i.status),
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="items-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        next(error);
    }
});
// POST /import - Bulk import items from JSON array (Must be before /:id)
router.post('/import', async (req, res, next) => {
    try {
        const rawItems = Array.isArray(req.body) ? req.body : req.body.items;
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            res.status(400).json({ success: false, error: 'Request body must be an array of items or have an items array property' });
            return;
        }
        const report = {
            total: rawItems.length,
            imported: 0,
            skipped: 0,
            errors: [],
        };
        // Pre-fetch all existing item codes for quick lookup
        const existingItems = await prisma_1.prisma.item.findMany({
            select: { itemCode: true },
        });
        const existingCodeSet = new Set(existingItems.map((i) => i.itemCode.toLowerCase().trim()));
        const seenInBatch = new Set();
        const itemsToCreate = [];
        for (let idx = 0; idx < rawItems.length; idx++) {
            const item = rawItems[idx];
            const rowNum = idx + 1;
            if (!item.itemCode || typeof item.itemCode !== 'string' || !item.itemCode.trim()) {
                report.errors.push(`Row ${rowNum}: Item code is required`);
                report.skipped++;
                continue;
            }
            if (!item.description || typeof item.description !== 'string' || !item.description.trim()) {
                report.errors.push(`Row ${rowNum} (${item.itemCode}): Description is required`);
                report.skipped++;
                continue;
            }
            const normalizedCode = item.itemCode.trim().toLowerCase();
            if (existingCodeSet.has(normalizedCode) || seenInBatch.has(normalizedCode)) {
                report.skipped++;
                continue;
            }
            seenInBatch.add(normalizedCode);
            itemsToCreate.push({
                itemCode: item.itemCode.trim(),
                description: item.description.trim(),
                category: item.category ? String(item.category).trim() : null,
                imageUrl: item.imageUrl ? String(item.imageUrl).trim() : null,
                unit: item.unit ? String(item.unit).trim() : 'PCS',
                standardCost: item.standardCost !== undefined && item.standardCost !== null ? new client_1.Prisma.Decimal(item.standardCost) : null,
                standardPrice: item.standardPrice !== undefined && item.standardPrice !== null ? new client_1.Prisma.Decimal(item.standardPrice) : null,
                currency: item.currency ? String(item.currency).trim() : 'INR',
                ppq: item.ppq ? String(item.ppq).trim() : null,
                currentStock: item.currentStock !== undefined && item.currentStock !== null ? Number(item.currentStock) || 0 : 0,
                leadTimeDays: item.leadTimeDays !== undefined && item.leadTimeDays !== null ? Number(item.leadTimeDays) || null : null,
                supplierCode: item.supplierCode ? String(item.supplierCode).trim() : null,
                supplierCurrency: item.supplierCurrency ? String(item.supplierCurrency).trim() : null,
                supplierCost: item.supplierCost !== undefined && item.supplierCost !== null ? new client_1.Prisma.Decimal(item.supplierCost) : null,
                status: item.status && Object.values(client_1.ItemStatus).includes(item.status) ? item.status : 'ACTIVE',
            });
        }
        if (itemsToCreate.length > 0) {
            const result = await prisma_1.prisma.item.createMany({
                data: itemsToCreate,
                skipDuplicates: true,
            });
            report.imported = result.count;
        }
        res.json({
            success: true,
            data: report,
            message: `Successfully imported ${report.imported} items. Skipped ${report.skipped}.`,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET / - List items with search, filters, pagination
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(500, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const category = req.query.category;
        const status = req.query.status;
        const where = {};
        if (status && Object.values(client_1.ItemStatus).includes(status)) {
            where.status = status;
        }
        const conditions = [];
        if (category) {
            conditions.push({
                OR: [
                    { category: { contains: category, mode: 'insensitive' } },
                    { description: { contains: category, mode: 'insensitive' } },
                    { itemCode: { contains: category, mode: 'insensitive' } },
                ],
            });
        }
        if (search) {
            conditions.push({
                OR: [
                    { itemCode: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { supplierCode: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                ],
            });
        }
        if (conditions.length === 1) {
            where.OR = conditions[0].OR;
        }
        else if (conditions.length > 1) {
            where.AND = conditions;
        }
        const [total, items] = await Promise.all([
            prisma_1.prisma.item.count({ where }),
            prisma_1.prisma.item.findMany({
                where,
                skip,
                take: limit,
                orderBy: { itemCode: 'asc' },
            }),
        ]);
        res.json({
            success: true,
            data: items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /:id - Get item by id
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await prisma_1.prisma.item.findUnique({
            where: { id },
        });
        if (!item) {
            res.status(404).json({ success: false, error: 'Item not found' });
            return;
        }
        res.json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST / - Create item with duplicate check
router.post('/', (0, validate_1.validate)(createItemSchema), async (req, res, next) => {
    try {
        const { itemCode, description, category, imageUrl, unit, standardCost, standardPrice, currency, ppq, currentStock, leadTimeDays, supplierCode, supplierCurrency, supplierCost, status, } = req.body;
        const existing = await prisma_1.prisma.item.findUnique({
            where: { itemCode: itemCode.trim() },
        });
        if (existing) {
            res.status(409).json({ success: false, error: `Item code "${itemCode}" already exists` });
            return;
        }
        const item = await prisma_1.prisma.item.create({
            data: {
                itemCode: itemCode.trim(),
                description: description.trim(),
                category: category || null,
                imageUrl: imageUrl || null,
                unit: unit || 'PCS',
                standardCost: standardCost !== undefined && standardCost !== null ? new client_1.Prisma.Decimal(standardCost) : null,
                standardPrice: standardPrice !== undefined && standardPrice !== null ? new client_1.Prisma.Decimal(standardPrice) : null,
                currency: currency || 'INR',
                ppq: ppq || null,
                currentStock: currentStock ?? 0,
                leadTimeDays: leadTimeDays ?? null,
                supplierCode: supplierCode || null,
                supplierCurrency: supplierCurrency || null,
                supplierCost: supplierCost !== undefined && supplierCost !== null ? new client_1.Prisma.Decimal(supplierCost) : null,
                status: status || 'ACTIVE',
            },
        });
        res.status(201).json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id - Update item
router.put('/:id', (0, validate_1.validate)(updateItemSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { itemCode, standardCost, standardPrice, supplierCost, ...rest } = req.body;
        const existing = await prisma_1.prisma.item.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Item not found' });
            return;
        }
        if (itemCode && itemCode.trim() !== existing.itemCode) {
            const codeExists = await prisma_1.prisma.item.findUnique({ where: { itemCode: itemCode.trim() } });
            if (codeExists) {
                res.status(409).json({ success: false, error: `Item code "${itemCode}" is already in use` });
                return;
            }
        }
        const dataToUpdate = { ...rest };
        if (itemCode)
            dataToUpdate.itemCode = itemCode.trim();
        if (standardCost !== undefined) {
            dataToUpdate.standardCost = standardCost !== null ? new client_1.Prisma.Decimal(standardCost) : null;
        }
        if (standardPrice !== undefined) {
            dataToUpdate.standardPrice = standardPrice !== null ? new client_1.Prisma.Decimal(standardPrice) : null;
        }
        if (supplierCost !== undefined) {
            dataToUpdate.supplierCost = supplierCost !== null ? new client_1.Prisma.Decimal(supplierCost) : null;
        }
        const updated = await prisma_1.prisma.item.update({
            where: { id },
            data: dataToUpdate,
        });
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /:id - Delete item
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.prisma.item.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Item not found' });
            return;
        }
        // Safely decouple foreign key references before deleting
        await prisma_1.prisma.quotationItem.updateMany({
            where: { itemId: id },
            data: { itemId: null },
        });
        await prisma_1.prisma.orderItem.updateMany({
            where: { itemId: id },
            data: { itemId: null },
        });
        await prisma_1.prisma.item.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: `Item "${existing.itemCode}" deleted successfully`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
