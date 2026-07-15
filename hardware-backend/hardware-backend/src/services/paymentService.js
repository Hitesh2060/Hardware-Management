import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

/**
 * Records a payment AGAINST an existing due balance (customer paying off
 * their credit sale later, or the shop paying a supplier's due purchase).
 * This is distinct from the paidAmount captured at the moment a Sale/
 * Purchase is created (see salesOrderService.js / purchaseOrderService.js) — this
 * is for money that arrives afterward.
 */
export async function recordCustomerPayment({ customerId, saleId, amount, method, note }) {
  return prisma.$transaction(async (tx) => {
    if (saleId) {
      const sale = await tx.sale.findUnique({ where: { id: saleId } });
      if (!sale) throw ApiError.badRequest('Invalid sale');
      if (amount > Number(sale.dueAmount)) {
        throw ApiError.badRequest(`Payment (${amount}) exceeds remaining due (${sale.dueAmount})`);
      }
      await tx.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: { increment: amount },
          dueAmount: { decrement: amount },
        },
      });
    }

    return tx.payment.create({
      data: { direction: 'IN', method, amount, saleId, customerId, note, paidAt: new Date() },
    });
  });
}

export async function recordSupplierPayment({ supplierId, purchaseId, amount, method, note }) {
  return prisma.$transaction(async (tx) => {
    if (purchaseId) {
      const purchase = await tx.purchase.findUnique({ where: { id: purchaseId } });
      if (!purchase) throw ApiError.badRequest('Invalid purchase');
      if (amount > Number(purchase.dueAmount)) {
        throw ApiError.badRequest(`Payment (${amount}) exceeds remaining due (${purchase.dueAmount})`);
      }
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          paidAmount: { increment: amount },
          dueAmount: { decrement: amount },
        },
      });
    }

    return tx.payment.create({
      data: { direction: 'OUT', method, amount, purchaseId, supplierId, note, paidAt: new Date() },
    });
  });
}

export async function listPayments({ direction, customerId, supplierId, page = 1, limit = 20 }) {
  // Parse and validate pagination parameters
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    ...(direction ? { direction } : {}),
    ...(customerId ? { customerId } : {}),
    ...(supplierId ? { supplierId } : {}),
  };
  
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { customer: true, supplier: true },
      orderBy: { paidAt: 'desc' },
      skip: skip,
      take: parsedLimit,
    }),
    prisma.payment.count({ where }),
  ]);
  
  return { 
    items, 
    pagination: { 
      page: parsedPage, 
      limit: parsedLimit, 
      total, 
      totalPages: Math.ceil(total / parsedLimit) 
    } 
  };
}