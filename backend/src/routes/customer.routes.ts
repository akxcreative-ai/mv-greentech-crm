import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  designation: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  isPrimary: z.boolean().optional().default(false),
});

const createCustomerSchema = z.object({
  customerCode: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  industry: z.string().optional().nullable(),
  customerType: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().default('India'),
  postalCode: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  accountOwnerId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  contacts: z.array(contactSchema).optional(),
});

const updateCustomerSchema = z.object({
  customerCode: z.string().optional(),
  name: z.string().min(1).optional(),
  industry: z.string().optional().nullable(),
  customerType: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  accountOwnerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET / - List customers with search and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const industry = req.query.industry as string | undefined;
    const isActive = req.query.isActive as string | undefined;

    const where: any = {};

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

    if (req.user?.role === 'SALESPERSON') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { accountOwnerId: req.user.id },
            { accountOwnerId: null },
          ],
        },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
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
  } catch (error) {
    next(error);
  }
});

// GET /:id - Get customer by id with contacts and counts
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
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

    if (req.user?.role === 'SALESPERSON' && customer.accountOwnerId && customer.accountOwnerId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access forbidden: This customer is managed by another salesperson' });
      return;
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// POST / - Create customer with optional contacts
router.post(
  '/',
  validate(createCustomerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { contacts, customerCode, ...customerData } = req.body;

      // Duplicate check: Check by GST or Customer Name
      const duplicateConditions: any[] = [
        { name: { equals: customerData.name, mode: 'insensitive' } },
      ];
      if (customerData.gstNumber && customerData.gstNumber.trim().length > 3) {
        duplicateConditions.push({ gstNumber: { equals: customerData.gstNumber.trim(), mode: 'insensitive' } });
      }

      const existingCust = await prisma.customer.findFirst({
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
        const count = await prisma.customer.count();
        finalCode = `CUST-${year}-${String(count + 1).padStart(4, '0')}`;
      }

      const customer = await prisma.customer.create({
        data: {
          ...customerData,
          customerCode: finalCode,
          accountOwnerId: req.user?.role === 'SALESPERSON' ? req.user.id : (customerData.accountOwnerId || req.user?.id),
          contacts: contacts && contacts.length > 0 ? {
            create: contacts.map((c: any) => ({
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
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id - Update customer
router.put(
  '/:id',
  validate(updateCustomerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const existing = await prisma.customer.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Customer not found' });
        return;
      }

      if (req.user?.role === 'SALESPERSON' && existing.accountOwnerId && existing.accountOwnerId !== req.user.id) {
        res.status(403).json({ success: false, error: 'Access forbidden: Cannot update customer belonging to another account owner' });
        return;
      }

      const customer = await prisma.customer.update({
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
    } catch (error) {
      next(error);
    }
  }
);

// POST /:id/contacts - Add contact to customer
router.post(
  '/:id/contacts',
  validate(contactSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const customerExists = await prisma.customer.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!customerExists) {
        res.status(404).json({ success: false, error: 'Customer not found' });
        return;
      }

      // If this contact is set to primary, clear existing primary status
      if (req.body.isPrimary) {
        await prisma.contact.updateMany({
          where: { customerId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const contact = await prisma.contact.create({
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
    } catch (error) {
      next(error);
    }
  }
);

export default router;
