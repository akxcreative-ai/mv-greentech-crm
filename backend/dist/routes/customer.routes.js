"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
const contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Contact name is required'),
    designation: zod_1.z.string().optional().nullable(),
    mobile: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    isPrimary: zod_1.z.boolean().optional().default(false),
});
const createCustomerSchema = zod_1.z.object({
    customerCode: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Customer name is required'),
    industry: zod_1.z.string().optional().nullable(),
    customerType: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    state: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().default('India'),
    postalCode: zod_1.z.string().optional().nullable(),
    gstNumber: zod_1.z.string().optional().nullable(),
    website: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    accountOwnerId: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional().default(true),
    contacts: zod_1.z.array(contactSchema).optional(),
});
const updateCustomerSchema = zod_1.z.object({
    customerCode: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).optional(),
    industry: zod_1.z.string().optional().nullable(),
    customerType: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    state: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().nullable(),
    postalCode: zod_1.z.string().optional().nullable(),
    gstNumber: zod_1.z.string().optional().nullable(),
    website: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    accountOwnerId: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
// GET / - List customers with search and pagination
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const city = req.query.city;
        const industry = req.query.industry;
        const isActive = req.query.isActive;
        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (industry) {
            where.industry = { contains: industry, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { industry: { contains: search, mode: 'insensitive' } },
                { gstNumber: { contains: search, mode: 'insensitive' } },
                { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } },
                { contacts: { some: { email: { contains: search, mode: 'insensitive' } } } },
                { contacts: { some: { mobile: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const [total, customers] = await Promise.all([
            prisma_1.prisma.customer.count({ where }),
            prisma_1.prisma.customer.findMany({
                where,
                include: {
                    contacts: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                    _count: {
                        select: {
                            contacts: true,
                            leads: true,
                            quotations: true,
                            orders: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
        ]);
        res.json({
            success: true,
            data: customers,
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
// GET /:id - Get customer by id with contacts and counts
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id },
            include: {
                contacts: {
                    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
                },
                _count: {
                    select: {
                        leads: true,
                        quotations: true,
                        orders: true,
                    },
                },
            },
        });
        if (!customer) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }
        res.json({
            success: true,
            data: customer,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST / - Create customer with optional contacts
router.post('/', (0, validate_1.validate)(createCustomerSchema), async (req, res, next) => {
    try {
        const { contacts, customerCode, ...customerData } = req.body;
        // Duplicate check: Check by GST or Customer Name
        const duplicateConditions = [
            { name: { equals: customerData.name, mode: 'insensitive' } },
        ];
        if (customerData.gstNumber && customerData.gstNumber.trim().length > 3) {
            duplicateConditions.push({ gstNumber: { equals: customerData.gstNumber.trim(), mode: 'insensitive' } });
        }
        const existingCust = await prisma_1.prisma.customer.findFirst({
            where: { OR: duplicateConditions },
            select: { id: true, customerCode: true, name: true, city: true, gstNumber: true },
        });
        if (existingCust && req.query.force !== 'true') {
            res.status(409).json({
                success: false,
                isDuplicate: true,
                existingCustomer: existingCust,
                error: `Possible duplicate customer: "${existingCust.name}" (${existingCust.customerCode || 'Code pending'}) already exists in ${existingCust.city || 'catalog'}. Pass ?force=true to create anyway.`,
            });
            return;
        }
        // Generate customerCode if not supplied
        let finalCode = customerCode;
        if (!finalCode) {
            const year = new Date().getFullYear();
            const count = await prisma_1.prisma.customer.count();
            finalCode = `CUST-${year}-${String(count + 1).padStart(4, '0')}`;
        }
        const customer = await prisma_1.prisma.customer.create({
            data: {
                ...customerData,
                customerCode: finalCode,
                accountOwnerId: customerData.accountOwnerId || req.user?.id,
                contacts: contacts && contacts.length > 0 ? {
                    create: contacts.map((c) => ({
                        name: c.name,
                        designation: c.designation || null,
                        mobile: c.mobile || null,
                        email: c.email || null,
                        isPrimary: c.isPrimary ?? false,
                    })),
                } : undefined,
            },
            include: {
                contacts: true,
                _count: {
                    select: {
                        leads: true,
                        quotations: true,
                        orders: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: customer,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id - Update customer
router.put('/:id', (0, validate_1.validate)(updateCustomerSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const customer = await prisma_1.prisma.customer.update({
            where: { id },
            data: req.body,
            include: {
                contacts: true,
                _count: {
                    select: {
                        leads: true,
                        quotations: true,
                        orders: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: customer,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /:id/contacts - Add contact to customer
router.post('/:id/contacts', (0, validate_1.validate)(contactSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const customerExists = await prisma_1.prisma.customer.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!customerExists) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }
        // If this contact is set to primary, clear existing primary status
        if (req.body.isPrimary) {
            await prisma_1.prisma.contact.updateMany({
                where: { customerId: id, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        const contact = await prisma_1.prisma.contact.create({
            data: {
                customerId: id,
                name: req.body.name,
                designation: req.body.designation || null,
                mobile: req.body.mobile || null,
                email: req.body.email || null,
                isPrimary: req.body.isPrimary ?? false,
            },
        });
        res.status(201).json({
            success: true,
            data: contact,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
