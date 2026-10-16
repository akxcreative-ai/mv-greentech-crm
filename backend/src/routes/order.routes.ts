import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(verifyToken);

const orderStatusEnum = z.enum([
  'CONFIRMED',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
  notes: z.string().optional().nullable(),
});

// GET / - List orders with filters & pagination
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, customerId, leadId, quotationId, fromDate, toDate, search } = req.query;

    const where: any = {};

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    if (leadId) {
      where.leadId = leadId as string;
    }

    if (quotationId) {
      where.quotationId = quotationId as string;
    }

    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate as string);
      if (toDate) {
        const to = new Date(toDate as string);
        to.setHours(23, 59, 59, 999);
        where.orderDate.lte = to;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, city: true } },
          quotation: { select: { id: true, quotationNumber: true } },
          lead: { select: { id: true, leadNumber: true, customerName: true } },
          _count: { select: { items: true } },
        },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: orders,
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

// GET /:id - Get order by ID with items
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: true,
        lead: {
          select: {
            id: true,
            leadNumber: true,
            customerName: true,
            accountOwner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            item: { select: { id: true, itemCode: true, description: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /:id/status - Update order status
router.put(
  '/:id/status',
  validate(updateOrderStatusSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status,
          notes: notes !== undefined ? notes : order.notes,
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // If associated with a lead, log activity
      if (order.leadId) {
        await prisma.leadActivity.create({
          data: {
            leadId: order.leadId,
            userId: req.user!.id,
            type: 'ORDER_STATUS_CHANGE',
            description: `Order ${order.orderNumber} status changed from ${order.status} to ${status}`,
            metadata: { orderId: order.id, oldStatus: order.status, newStatus: status, notes },
          },
        });
      }

      res.json({
        success: true,
        data: updated,
        message: `Order status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
