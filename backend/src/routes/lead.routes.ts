import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const leadStatusEnum = z.enum(['GENERAL', 'MARKET', 'QUOTE_SUBMITTED', 'WON', 'LOST']);

const createLeadSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer name is required'),
  contactPerson: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().default('India'),
  postalCode: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  manufacturerOrTrader: z.string().optional().nullable(),
  productsManufactured: z.string().optional().nullable(),
  productsRequired: z.string().optional().nullable(),
  partType: z.string().optional().nullable(),
  requirementType: z.string().optional().nullable(),
  annualQuantity: z.string().optional().nullable(),
  competitors: z.string().optional().nullable(),
  enquiryValue: z.number().or(z.string()).optional().nullable(),
  currency: z.string().optional().default('INR'),
  accountOwnerId: z.string().optional().nullable(),
  status: leadStatusEnum.optional().default('GENERAL'),
  nextAction: z.string().optional().nullable(),
  nextFollowUpDate: z.string().or(z.date()).optional().nullable(),
  customerVisitDate: z.string().or(z.date()).optional().nullable(),
  firstOrderDate: z.string().or(z.date()).optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const updateLeadSchema = createLeadSchema.partial();

const addActivitySchema = z.object({
  type: z.string().min(1, 'Activity type is required'), // note, call, email, visit, meeting
  description: z.string().min(1, 'Description is required'),
  metadata: z.record(z.any()).optional().nullable(),
});

const assignLeadSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
  notes: z.string().optional().nullable(),
});

// Helper for generating lead number
const generateLeadNumber = async (): Promise<string> => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const prefix = `LD-${yyyy}${mm}${dd}`;

  const lastLead = await prisma.lead.findFirst({
    where: {
      leadNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { leadNumber: 'desc' },
  });

  let nextSeq = 1;
  if (lastLead) {
    const parts = lastLead.leadNumber.split('-');
    const currentSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(currentSeq)) {
      nextSeq = currentSeq + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
};

// GET /export/csv - Export leads to CSV (Must be before /:id)
router.get('/export/csv', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, owner, accountOwnerId, industry, city } = req.query;
    const where: any = { isArchived: false };

    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      where.status = status as LeadStatus;
    }
    if (req.user?.role === 'SALESPERSON') {
      where.accountOwnerId = req.user.id;
    } else {
      const targetOwner = (accountOwnerId || owner) as string | undefined;
      if (targetOwner) {
        where.accountOwnerId = targetOwner;
      }
    }
    if (industry) {
      where.industry = { contains: industry as string, mode: 'insensitive' };
    }
    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        accountOwner: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Lead Number',
      'Customer Name',
      'Contact Person',
      'Mobile',
      'Email',
      'City',
      'Industry',
      'Status',
      'Enquiry Value',
      'Currency',
      'Account Owner',
      'Next Action',
      'Next Follow Up Date',
      'Created At',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map((l) => [
      escapeCsv(l.leadNumber),
      escapeCsv(l.customerName),
      escapeCsv(l.contactPerson),
      escapeCsv(l.mobile),
      escapeCsv(l.email),
      escapeCsv(l.city),
      escapeCsv(l.industry),
      escapeCsv(l.status),
      escapeCsv(l.enquiryValue ? l.enquiryValue.toString() : '0'),
      escapeCsv(l.currency),
      escapeCsv(l.accountOwner ? `${l.accountOwner.firstName} ${l.accountOwner.lastName}` : 'Unassigned'),
      escapeCsv(l.nextAction),
      escapeCsv(l.nextFollowUpDate ? l.nextFollowUpDate.toISOString().split('T')[0] : ''),
      escapeCsv(l.createdAt.toISOString().split('T')[0]),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET / - List leads with filters, pagination, sorting
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const {
      status,
      owner,
      accountOwnerId,
      industry,
      city,
      fromDate,
      toDate,
      search,
      isArchived,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: any = {};

    if (isArchived !== undefined) {
      where.isArchived = isArchived === 'true';
    } else {
      where.isArchived = false;
    }

    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      where.status = status as LeadStatus;
    }

    if (req.user?.role === 'SALESPERSON') {
      where.accountOwnerId = req.user.id;
    } else {
      const ownerFilter = (accountOwnerId || owner) as string | undefined;
      if (ownerFilter) {
        where.accountOwnerId = ownerFilter;
      }
    }

    if (industry) {
      where.industry = { contains: industry as string, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    if (fromDate || toDate) {
      where.loginDate = {};
      if (fromDate) where.loginDate.gte = new Date(fromDate as string);
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        where.loginDate.lte = to;
      }
    }

    if (search) {
      const q = search as string;
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { leadNumber: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { productsRequired: { contains: q, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['createdAt', 'loginDate', 'customerName', 'enquiryValue', 'nextFollowUpDate', 'status'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: {
          accountOwner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          customer: {
            select: { id: true, name: true, city: true },
          },
          _count: {
            select: {
              activities: true,
              followUps: true,
              quotations: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortField]: direction },
      }),
    ]);

    res.json({
      success: true,
      data: leads,
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

// GET /:id - Get lead details with relations
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        accountOwner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        customer: true,
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { scheduledDate: 'desc' },
        },
        quotations: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    // Role-based record authorization: Salespersons can only view their own leads
    if (req.user?.role === 'SALESPERSON' && lead.accountOwnerId !== req.user.id && lead.createdById !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access forbidden: You do not have permission to view this lead' });
      return;
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

// POST / - Create lead with auto-generated leadNumber and log activity
router.post(
  '/',
  validate(createLeadSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leadNumber = await generateLeadNumber();
      const currentUserId = req.user!.id;

      const {
        enquiryValue,
        nextFollowUpDate,
        customerVisitDate,
        firstOrderDate,
        accountOwnerId,
        ...rest
      } = req.body;

      // Duplicate lead check
      const duplicateConditions: any[] = [];
      if (rest.mobile && rest.mobile.trim().length >= 8) {
        duplicateConditions.push({ mobile: rest.mobile.trim() });
      }
      if (rest.email && rest.email.trim().length >= 5) {
        duplicateConditions.push({ email: rest.email.toLowerCase().trim() });
      }
      if (rest.customerName && rest.customerName.trim().length >= 3) {
        duplicateConditions.push({ customerName: { equals: rest.customerName.trim(), mode: 'insensitive' } });
      }

      if (duplicateConditions.length > 0) {
        const existingLead = await prisma.lead.findFirst({
          where: {
            OR: duplicateConditions,
            isArchived: false,
          },
          select: {
            id: true,
            leadNumber: true,
            customerName: true,
            mobile: true,
            email: true,
            city: true,
            status: true,
          },
        });

        if (existingLead && req.query.force !== 'true') {
          res.status(409).json({
            success: false,
            isDuplicate: true,
            existingLead,
            error: `Possible duplicate lead detected: "${existingLead.customerName}" (${existingLead.leadNumber}) already exists in status "${existingLead.status}". Pass ?force=true to create anyway.`,
          });
          return;
        }
      }

      const lead = await prisma.lead.create({
        data: {
          ...rest,
          leadNumber,
          accountOwnerId: req.user?.role === 'SALESPERSON' ? currentUserId : (accountOwnerId || currentUserId),
          createdById: currentUserId.startsWith('demo-') ? null : currentUserId,
          updatedById: currentUserId.startsWith('demo-') ? null : currentUserId,
          enquiryValue: enquiryValue !== undefined && enquiryValue !== null
            ? new Prisma.Decimal(enquiryValue)
            : null,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
          customerVisitDate: customerVisitDate ? new Date(customerVisitDate) : null,
          firstOrderDate: firstOrderDate ? new Date(firstOrderDate) : null,
        },
        include: {
          accountOwner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Log lead creation activity
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: currentUserId,
          type: 'CREATION',
          description: `Lead ${lead.leadNumber} created for ${lead.customerName}`,
          metadata: { initialStatus: lead.status },
        },
      });

      // If initial owner is assigned, record assignment
      if (lead.accountOwnerId) {
        await prisma.leadAssignment.create({
          data: {
            leadId: lead.id,
            userId: lead.accountOwnerId,
            notes: 'Initial assignment upon lead creation',
          },
        });
      }

      res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id - Update lead and log status changes
router.put(
  '/:id',
  validate(updateLeadSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.id;

      const existingLead = await prisma.lead.findUnique({ where: { id } });
      if (!existingLead) {
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      // Record authorization: Salespersons can only update their own leads
      if (req.user?.role === 'SALESPERSON' && existingLead.accountOwnerId !== currentUserId && existingLead.createdById !== currentUserId) {
        res.status(403).json({ success: false, error: 'Access forbidden: You do not have permission to update this lead' });
        return;
      }

      const {
        enquiryValue,
        nextFollowUpDate,
        customerVisitDate,
        firstOrderDate,
        ...rest
      } = req.body;

      const dataToUpdate: any = { ...rest };

      if (enquiryValue !== undefined) {
        dataToUpdate.enquiryValue = enquiryValue !== null ? new Prisma.Decimal(enquiryValue) : null;
      }
      if (nextFollowUpDate !== undefined) {
        dataToUpdate.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
      }
      if (customerVisitDate !== undefined) {
        dataToUpdate.customerVisitDate = customerVisitDate ? new Date(customerVisitDate) : null;
      }
      if (firstOrderDate !== undefined) {
        dataToUpdate.firstOrderDate = firstOrderDate ? new Date(firstOrderDate) : null;
      }

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: dataToUpdate,
        include: {
          accountOwner: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // If status changed, record activity
      if (req.body.status && req.body.status !== existingLead.status) {
        await prisma.leadActivity.create({
          data: {
            leadId: id,
            userId: currentUserId,
            type: 'STATUS_CHANGE',
            description: `Status changed from ${existingLead.status} to ${req.body.status}`,
            metadata: { oldStatus: existingLead.status, newStatus: req.body.status },
          },
        });
      }

      res.json({
        success: true,
        data: updatedLead,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id/assign - Assign lead to user (Managers only)
router.put(
  '/:id/assign',
  requireRole('ADMINISTRATOR', 'DIRECTOR', 'SALES_HEAD'),
  validate(assignLeadSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, notes } = req.body;
      const currentUserId = req.user!.id;

      const [lead, targetUser] = await Promise.all([
        prisma.lead.findUnique({ where: { id } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);

      if (!lead) {
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      if (!targetUser) {
        res.status(404).json({ success: false, error: 'Target user not found' });
        return;
      }

      const [updatedLead] = await prisma.$transaction([
        prisma.lead.update({
          where: { id },
          data: { accountOwnerId: userId },
          include: {
            accountOwner: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        prisma.leadAssignment.create({
          data: {
            leadId: id,
            userId,
            notes: notes || null,
          },
        }),
        prisma.leadActivity.create({
          data: {
            leadId: id,
            userId: currentUserId,
            type: 'ASSIGNMENT',
            description: `Lead assigned to ${targetUser.firstName} ${targetUser.lastName}`,
            metadata: { assignedToUserId: userId, notes },
          },
        }),
      ]);

      res.json({
        success: true,
        data: updatedLead,
        message: `Lead assigned to ${targetUser.firstName} ${targetUser.lastName}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /:id/archive - Archive lead
router.put('/:id/archive', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    if (req.user?.role === 'SALESPERSON') {
      res.status(403).json({ success: false, error: 'Access forbidden: Salespersons cannot archive leads' });
      return;
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId: currentUserId,
        type: 'ARCHIVE',
        description: `Lead ${lead.leadNumber} was archived`,
      },
    });

    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead archived successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /:id/activities - Get lead activities
router.get('/:id/activities', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    const activities = await prisma.leadActivity.findMany({
      where: { leadId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

// POST /:id/activities - Add activity
router.post(
  '/:id/activities',
  validate(addActivitySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { type, description, metadata } = req.body;
      const currentUserId = req.user!.id;

      const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
      if (!lead) {
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }

      const activity = await prisma.leadActivity.create({
        data: {
          leadId: id,
          userId: currentUserId,
          type: type.toUpperCase(),
          description,
          metadata: metadata || null,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /:id/convert-to-customer - Convert lead into permanent Customer record
router.post('/:id/convert-to-customer', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    if (lead.customerId) {
      res.json({
        success: true,
        message: 'Lead is already linked to an existing customer record.',
        data: { customerId: lead.customerId },
      });
      return;
    }

    // Check if an existing customer with the same name already exists to avoid duplicates
    let customer = await prisma.customer.findFirst({
      where: {
        name: { equals: lead.customerName.trim(), mode: 'insensitive' },
      },
    });

    if (!customer) {
      const year = new Date().getFullYear();
      const count = await prisma.customer.count();
      const customerCode = `CUST-${year}-${String(count + 1).padStart(4, '0')}`;

      customer = await prisma.customer.create({
        data: {
          customerCode,
          name: lead.customerName,
          industry: lead.industry,
          customerType: lead.manufacturerOrTrader || 'Direct Client',
          address: lead.address,
          city: lead.city,
          state: lead.state,
          country: lead.country || 'India',
          postalCode: lead.postalCode,
          accountOwnerId: lead.accountOwnerId || (currentUserId.startsWith('demo-') ? null : currentUserId),
          notes: `Converted from Lead ${lead.leadNumber}. Requirements: ${lead.productsRequired || 'N/A'}`,
          contacts: lead.contactPerson
            ? {
                create: {
                  name: lead.contactPerson,
                  designation: lead.designation || undefined,
                  mobile: lead.mobile || undefined,
                  email: lead.email || undefined,
                  isPrimary: true,
                },
              }
            : undefined,
        },
      });
    }

    // Link lead to customer and mark WON if specified
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        customerId: customer.id,
        status: req.body.status === 'WON' ? 'WON' : lead.status,
      },
      include: { customer: true },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        userId: currentUserId.startsWith('demo-') ? (lead.accountOwnerId || 'demo-admin-id') : currentUserId,
        type: 'CUSTOMER_CONVERSION',
        description: `Lead converted to customer "${customer.name}" (${customer.customerCode || 'Code pending'})`,
        metadata: { customerId: customer.id, customerCode: customer.customerCode },
      },
    });

    res.json({
      success: true,
      message: `Lead successfully converted to customer "${customer.name}".`,
      data: { customer, lead: updatedLead },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
