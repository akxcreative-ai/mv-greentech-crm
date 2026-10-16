"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const pdfkit_1 = __importDefault(require("pdfkit"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.verifyToken);
const quotationStatusEnum = zod_1.z.enum([
    'DRAFT',
    'SENT',
    'NEGOTIATION',
    'APPROVED',
    'LOST',
    'EXPIRED',
    'CONVERTED',
]);
const lineItemSchema = zod_1.z.object({
    itemId: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().min(1, 'Item description is required'),
    quantity: zod_1.z.number().or(zod_1.z.string()).refine((v) => Number(v) > 0, 'Quantity must be greater than 0'),
    unit: zod_1.z.string().optional().default('PCS'),
    unitPrice: zod_1.z.number().or(zod_1.z.string()).refine((v) => Number(v) >= 0, 'Price must be >= 0'),
    discount: zod_1.z.number().or(zod_1.z.string()).optional().default(0),
    taxRate: zod_1.z.number().or(zod_1.z.string()).optional().default(0),
    sortOrder: zod_1.z.number().int().optional(),
});
const createQuotationSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, 'Customer ID is required'),
    leadId: zod_1.z.string().optional().nullable(),
    validityDate: zod_1.z.string().or(zod_1.z.date()),
    currency: zod_1.z.string().optional().default('INR'),
    paymentTerms: zod_1.z.string().optional().nullable(),
    deliveryTerms: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    specifications: zod_1.z.string().optional().nullable(),
    status: quotationStatusEnum.optional().default('DRAFT'),
    items: zod_1.z.array(lineItemSchema).min(1, 'At least one line item is required'),
});
const updateQuotationSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional().nullable(),
    validityDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    currency: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional().nullable(),
    deliveryTerms: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    specifications: zod_1.z.string().optional().nullable(),
    status: quotationStatusEnum.optional(),
    lostReason: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(lineItemSchema).optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: quotationStatusEnum,
    lostReason: zod_1.z.string().optional().nullable(),
});
// Helper for generating quotation number
const generateQuotationNumber = async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `QT-${yyyy}${mm}${dd}`;
    const lastQuotation = await prisma_1.prisma.quotation.findFirst({
        where: {
            quotationNumber: { startsWith: prefix },
        },
        orderBy: { quotationNumber: 'desc' },
    });
    let nextSeq = 1;
    if (lastQuotation) {
        const parts = lastQuotation.quotationNumber.split('-');
        const currentSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(currentSeq)) {
            nextSeq = currentSeq + 1;
        }
    }
    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
};
// Helper for generating order number
const generateOrderNumber = async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `ORD-${yyyy}${mm}${dd}`;
    const lastOrder = await prisma_1.prisma.order.findFirst({
        where: {
            orderNumber: { startsWith: prefix },
        },
        orderBy: { orderNumber: 'desc' },
    });
    let nextSeq = 1;
    if (lastOrder) {
        const parts = lastOrder.orderNumber.split('-');
        const currentSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(currentSeq)) {
            nextSeq = currentSeq + 1;
        }
    }
    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
};
// Helper to compute line item totals and aggregates
const calculateTotals = (items) => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;
    const processedItems = items.map((item, index) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        const discPercent = Number(item.discount) || 0;
        const taxPct = Number(item.taxRate) || 0;
        const gross = qty * price;
        const discVal = gross * (discPercent / 100);
        const base = gross - discVal;
        const taxVal = base * (taxPct / 100);
        const lineTotal = base + taxVal;
        subtotal += base;
        totalDiscount += discVal;
        totalTax += taxVal;
        grandTotal += lineTotal;
        return {
            itemId: item.itemId || null,
            description: item.description,
            quantity: new client_1.Prisma.Decimal(qty.toFixed(2)),
            unit: item.unit || 'PCS',
            unitPrice: new client_1.Prisma.Decimal(price.toFixed(2)),
            discount: new client_1.Prisma.Decimal(discPercent.toFixed(2)),
            taxRate: new client_1.Prisma.Decimal(taxPct.toFixed(2)),
            lineTotal: new client_1.Prisma.Decimal(lineTotal.toFixed(2)),
            sortOrder: item.sortOrder ?? index,
        };
    });
    return {
        processedItems,
        subtotal: new client_1.Prisma.Decimal(subtotal.toFixed(2)),
        taxAmount: new client_1.Prisma.Decimal(totalTax.toFixed(2)),
        discountAmount: new client_1.Prisma.Decimal(totalDiscount.toFixed(2)),
        totalAmount: new client_1.Prisma.Decimal(grandTotal.toFixed(2)),
    };
};
// GET /:id/pdf - Generate PDF for quotation (Registered before /:id)
router.get('/:id/pdf', async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id },
            include: {
                customer: true,
                user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                items: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!quotation) {
            res.status(404).json({ success: false, error: 'Quotation not found' });
            return;
        }
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Quotation-${quotation.quotationNumber}.pdf"`);
        doc.pipe(res);
        // Header: Company Details
        doc
            .fontSize(20)
            .fillColor('#0f4c3a')
            .text('MV GREENTECH PVT LTD', { align: 'left' });
        doc
            .fontSize(9)
            .fillColor('#555555')
            .text('Industrial Automation & Water Management Systems', { align: 'left' })
            .text('Website: www.mvgreentech.com | Email: sales@mvgreentech.com')
            .moveDown(0.5);
        // Divider
        doc
            .strokeColor('#0f4c3a')
            .lineWidth(2)
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .stroke()
            .moveDown(0.8);
        // Document Title
        const titleY = doc.y;
        doc
            .fontSize(16)
            .fillColor('#222222')
            .text('COMMERCIAL QUOTATION', 40, titleY, { align: 'left' })
            .fontSize(10)
            .fillColor('#777777')
            .text(`Status: ${quotation.status}`, 40, titleY + 20);
        // Meta details on the right
        doc
            .fontSize(9)
            .fillColor('#333333')
            .text(`Quote No: ${quotation.quotationNumber}`, 320, titleY, { align: 'right' })
            .text(`Date: ${quotation.quotationDate.toISOString().split('T')[0]}`, 320, titleY + 14, { align: 'right' })
            .text(`Valid Until: ${quotation.validityDate.toISOString().split('T')[0]}`, 320, titleY + 28, { align: 'right' })
            .text(`Sales Rep: ${quotation.user.firstName} ${quotation.user.lastName}`, 320, titleY + 42, { align: 'right' });
        doc.y = titleY + 65;
        // Customer Info Box
        const boxY = doc.y;
        doc
            .rect(40, boxY, 515, 60)
            .fillColor('#f8f9fa')
            .fill()
            .strokeColor('#e2e8f0')
            .lineWidth(1)
            .stroke();
        doc
            .fillColor('#0f4c3a')
            .fontSize(10)
            .text('QUOTATION FOR:', 50, boxY + 8)
            .fillColor('#111827')
            .fontSize(10)
            .text(quotation.customer.name, 50, boxY + 22)
            .fontSize(9)
            .fillColor('#4b5563')
            .text(`${quotation.customer.address || ''}${quotation.customer.city ? `, ${quotation.customer.city}` : ''}${quotation.customer.country ? `, ${quotation.customer.country}` : ''}`, 50, boxY + 36)
            .text(`GSTIN: ${quotation.customer.gstNumber || 'N/A'}`, 350, boxY + 22);
        doc.y = boxY + 75;
        // Line Items Table Header
        const tableTop = doc.y;
        doc
            .rect(40, tableTop, 515, 20)
            .fillColor('#0f4c3a')
            .fill();
        doc
            .fillColor('#ffffff')
            .fontSize(8)
            .text('#', 45, tableTop + 5, { width: 20 })
            .text('Description', 70, tableTop + 5, { width: 190 })
            .text('Qty', 265, tableTop + 5, { width: 35, align: 'right' })
            .text('Unit', 305, tableTop + 5, { width: 35, align: 'center' })
            .text('Unit Price', 345, tableTop + 5, { width: 60, align: 'right' })
            .text('Tax %', 410, tableTop + 5, { width: 40, align: 'right' })
            .text(`Total (${quotation.currency})`, 455, tableTop + 5, { width: 95, align: 'right' });
        let currentY = tableTop + 24;
        // Line Items
        quotation.items.forEach((item, index) => {
            const isEven = index % 2 === 0;
            if (isEven) {
                doc.rect(40, currentY - 2, 515, 18).fillColor('#fafafa').fill();
            }
            doc
                .fillColor('#333333')
                .fontSize(8)
                .text(String(index + 1), 45, currentY, { width: 20 })
                .text(item.description, 70, currentY, { width: 190 })
                .text(item.quantity.toString(), 265, currentY, { width: 35, align: 'right' })
                .text(item.unit, 305, currentY, { width: 35, align: 'center' })
                .text(Number(item.unitPrice).toFixed(2), 345, currentY, { width: 60, align: 'right' })
                .text(`${Number(item.taxRate).toFixed(1)}%`, 410, currentY, { width: 40, align: 'right' })
                .text(Number(item.lineTotal).toFixed(2), 455, currentY, { width: 95, align: 'right' });
            currentY += 18;
        });
        // Divider
        doc.moveTo(40, currentY + 4).lineTo(555, currentY + 4).strokeColor('#e2e8f0').stroke();
        currentY += 12;
        // Summary Totals on Right
        const summaryX = 350;
        doc
            .fontSize(9)
            .fillColor('#4b5563')
            .text('Subtotal:', summaryX, currentY, { width: 90, align: 'left' })
            .text(`${quotation.currency} ${Number(quotation.subtotal).toFixed(2)}`, 450, currentY, { width: 105, align: 'right' });
        currentY += 15;
        if (Number(quotation.discountAmount) > 0) {
            doc
                .text('Discount:', summaryX, currentY, { width: 90, align: 'left' })
                .text(`- ${quotation.currency} ${Number(quotation.discountAmount).toFixed(2)}`, 450, currentY, { width: 105, align: 'right' });
            currentY += 15;
        }
        doc
            .text('Tax Amount:', summaryX, currentY, { width: 90, align: 'left' })
            .text(`${quotation.currency} ${Number(quotation.taxAmount).toFixed(2)}`, 450, currentY, { width: 105, align: 'right' });
        currentY += 16;
        doc.rect(summaryX - 5, currentY - 3, 215, 20).fillColor('#e6f4ea').fill();
        doc
            .fontSize(10)
            .fillColor('#0f4c3a')
            .text('Grand Total:', summaryX, currentY + 2, { width: 90, align: 'left' })
            .text(`${quotation.currency} ${Number(quotation.totalAmount).toFixed(2)}`, 450, currentY + 2, { width: 105, align: 'right' });
        currentY += 35;
        // Terms and Notes
        if (doc.y > 680) {
            doc.addPage();
            currentY = 50;
        }
        doc
            .fontSize(10)
            .fillColor('#0f4c3a')
            .text('Terms & Conditions:', 40, currentY)
            .moveDown(0.3);
        doc
            .fontSize(8)
            .fillColor('#4b5563')
            .text(`1. Payment Terms: ${quotation.paymentTerms || 'Standard Payment Terms apply.'}`)
            .text(`2. Delivery Terms: ${quotation.deliveryTerms || 'Subject to dispatch confirmation.'}`)
            .text(`3. Validity: This quotation is valid until ${quotation.validityDate.toISOString().split('T')[0]}.`);
        if (quotation.notes) {
            doc.moveDown(0.5).text(`Notes: ${quotation.notes}`);
        }
        doc.end();
    }
    catch (error) {
        next(error);
    }
});
// GET / - List quotations with filters & pagination
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const { status, customer, customerId, user, userId, fromDate, toDate } = req.query;
        const where = {};
        if (status && Object.values(client_1.QuotationStatus).includes(status)) {
            where.status = status;
        }
        const targetCustomer = (customerId || customer);
        if (targetCustomer) {
            where.customerId = targetCustomer;
        }
        const targetUser = (userId || user);
        if (targetUser) {
            where.userId = targetUser;
        }
        if (fromDate || toDate) {
            where.quotationDate = {};
            if (fromDate)
                where.quotationDate.gte = new Date(fromDate);
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                where.quotationDate.lte = to;
            }
        }
        const [total, quotations] = await Promise.all([
            prisma_1.prisma.quotation.count({ where }),
            prisma_1.prisma.quotation.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, city: true } },
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                    _count: { select: { items: true, orders: true } },
                },
                skip,
                take: limit,
                orderBy: { quotationDate: 'desc' },
            }),
        ]);
        res.json({
            success: true,
            data: quotations,
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
// GET /:id - Get quotation with items and relations
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id },
            include: {
                customer: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                lead: { select: { id: true, leadNumber: true, customerName: true } },
                items: {
                    include: {
                        item: { select: { id: true, itemCode: true, description: true } },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                orders: { select: { id: true, orderNumber: true, status: true, totalAmount: true } },
            },
        });
        if (!quotation) {
            res.status(404).json({ success: false, error: 'Quotation not found' });
            return;
        }
        res.json({
            success: true,
            data: quotation,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST / - Create quotation
router.post('/', (0, validate_1.validate)(createQuotationSchema), async (req, res, next) => {
    try {
        const { customerId, leadId, validityDate, currency = 'INR', paymentTerms, deliveryTerms, notes, specifications, status = 'DRAFT', items, } = req.body;
        const quotationNumber = await generateQuotationNumber();
        const currentUserId = req.user.id;
        const { processedItems, subtotal, taxAmount, discountAmount, totalAmount } = calculateTotals(items);
        const quotation = await prisma_1.prisma.quotation.create({
            data: {
                quotationNumber,
                customerId,
                leadId: leadId || null,
                userId: currentUserId,
                validityDate: new Date(validityDate),
                currency,
                subtotal,
                taxAmount,
                discountAmount,
                totalAmount,
                paymentTerms: paymentTerms || null,
                deliveryTerms: deliveryTerms || null,
                notes: notes || null,
                specifications: specifications || null,
                status,
                items: {
                    create: processedItems,
                },
            },
            include: {
                items: true,
                customer: true,
            },
        });
        // If tied to a lead, update lead status to QUOTE_SUBMITTED if general/market
        if (leadId) {
            const lead = await prisma_1.prisma.lead.findUnique({ where: { id: leadId } });
            if (lead && (lead.status === 'GENERAL' || lead.status === 'MARKET')) {
                await prisma_1.prisma.lead.update({
                    where: { id: leadId },
                    data: { status: 'QUOTE_SUBMITTED' },
                });
            }
            await prisma_1.prisma.leadActivity.create({
                data: {
                    leadId,
                    userId: currentUserId,
                    type: 'QUOTATION_CREATED',
                    description: `Quotation ${quotationNumber} created with total value ${currency} ${totalAmount.toString()}`,
                    metadata: { quotationId: quotation.id, totalAmount: totalAmount.toString() },
                },
            });
        }
        res.status(201).json({
            success: true,
            data: quotation,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id - Update quotation and items
router.put('/:id', (0, validate_1.validate)(updateQuotationSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.prisma.quotation.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Quotation not found' });
            return;
        }
        const { customerId, leadId, validityDate, currency, paymentTerms, deliveryTerms, notes, specifications, status, lostReason, items, } = req.body;
        const dataToUpdate = {};
        if (customerId !== undefined)
            dataToUpdate.customerId = customerId;
        if (leadId !== undefined)
            dataToUpdate.leadId = leadId;
        if (validityDate !== undefined)
            dataToUpdate.validityDate = new Date(validityDate);
        if (currency !== undefined)
            dataToUpdate.currency = currency;
        if (paymentTerms !== undefined)
            dataToUpdate.paymentTerms = paymentTerms;
        if (deliveryTerms !== undefined)
            dataToUpdate.deliveryTerms = deliveryTerms;
        if (notes !== undefined)
            dataToUpdate.notes = notes;
        if (specifications !== undefined)
            dataToUpdate.specifications = specifications;
        if (status !== undefined)
            dataToUpdate.status = status;
        if (lostReason !== undefined)
            dataToUpdate.lostReason = lostReason;
        let result;
        if (items && items.length > 0) {
            const { processedItems, subtotal, taxAmount, discountAmount, totalAmount } = calculateTotals(items);
            dataToUpdate.subtotal = subtotal;
            dataToUpdate.taxAmount = taxAmount;
            dataToUpdate.discountAmount = discountAmount;
            dataToUpdate.totalAmount = totalAmount;
            result = await prisma_1.prisma.$transaction(async (tx) => {
                // Delete existing items
                await tx.quotationItem.deleteMany({ where: { quotationId: id } });
                // Update quotation with new items
                return tx.quotation.update({
                    where: { id },
                    data: {
                        ...dataToUpdate,
                        items: {
                            create: processedItems,
                        },
                    },
                    include: {
                        items: true,
                        customer: true,
                    },
                });
            });
        }
        else {
            result = await prisma_1.prisma.quotation.update({
                where: { id },
                data: dataToUpdate,
                include: {
                    items: true,
                    customer: true,
                },
            });
        }
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /:id/status - Change quotation status
router.put('/:id/status', (0, validate_1.validate)(updateStatusSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, lostReason } = req.body;
        const quotation = await prisma_1.prisma.quotation.findUnique({ where: { id } });
        if (!quotation) {
            res.status(404).json({ success: false, error: 'Quotation not found' });
            return;
        }
        const updated = await prisma_1.prisma.quotation.update({
            where: { id },
            data: {
                status,
                lostReason: status === 'LOST' ? lostReason || 'No reason specified' : null,
            },
        });
        if (quotation.leadId) {
            await prisma_1.prisma.leadActivity.create({
                data: {
                    leadId: quotation.leadId,
                    userId: req.user.id,
                    type: 'QUOTATION_STATUS_CHANGE',
                    description: `Quotation ${quotation.quotationNumber} status updated to ${status}`,
                    metadata: { quotationId: quotation.id, status, lostReason },
                },
            });
        }
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /:id/convert-to-order - Convert quotation to order
router.post('/:id/convert-to-order', async (req, res, next) => {
    try {
        const { id } = req.params;
        const quotation = await prisma_1.prisma.quotation.findUnique({
            where: { id },
            include: {
                items: true,
                customer: true,
            },
        });
        if (!quotation) {
            res.status(404).json({ success: false, error: 'Quotation not found' });
            return;
        }
        if (quotation.status === 'CONVERTED') {
            res.status(400).json({ success: false, error: 'Quotation has already been converted to an order' });
            return;
        }
        const orderNumber = await generateOrderNumber();
        const order = await prisma_1.prisma.$transaction(async (tx) => {
            // Create Order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    quotationId: quotation.id,
                    customerId: quotation.customerId,
                    leadId: quotation.leadId,
                    currency: quotation.currency,
                    totalAmount: quotation.totalAmount,
                    status: 'CONFIRMED',
                    paymentTerms: quotation.paymentTerms,
                    deliveryTerms: quotation.deliveryTerms,
                    notes: quotation.notes,
                    items: {
                        create: quotation.items.map((item) => ({
                            itemId: item.itemId,
                            description: item.description,
                            quantity: item.quantity,
                            unit: item.unit,
                            unitPrice: item.unitPrice,
                            lineTotal: item.lineTotal,
                        })),
                    },
                },
                include: {
                    items: true,
                    customer: true,
                },
            });
            // Update Quotation status to CONVERTED
            await tx.quotation.update({
                where: { id: quotation.id },
                data: { status: 'CONVERTED' },
            });
            // If associated with lead, update lead status to WON and firstOrderDate if not set
            if (quotation.leadId) {
                await tx.lead.update({
                    where: { id: quotation.leadId },
                    data: {
                        status: 'WON',
                        firstOrderDate: new Date(),
                    },
                });
                await tx.leadActivity.create({
                    data: {
                        leadId: quotation.leadId,
                        userId: req.user.id,
                        type: 'ORDER_CONVERTED',
                        description: `Quotation ${quotation.quotationNumber} converted to Order ${orderNumber} for total ${quotation.currency} ${quotation.totalAmount.toString()}`,
                        metadata: { orderId: newOrder.id, orderNumber },
                    },
                });
            }
            return newOrder;
        });
        res.status(201).json({
            success: true,
            data: order,
            message: `Quotation successfully converted to Order ${order.orderNumber}`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
