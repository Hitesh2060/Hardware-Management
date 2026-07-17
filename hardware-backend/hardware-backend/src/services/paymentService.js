import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { recordCustomerLedger, recordSupplierLedger } from './ledgerService.js';
import { generateReceiptNumber } from '../utils/generateReceiptNumber.js';

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

    // ✅ Generate human-readable receipt number
    const receiptNo = await generateReceiptNumber(tx, 'RCPT');

    const payment = await tx.payment.create({
      data: { 
        direction: 'IN', 
        method, 
        amount, 
        saleId, 
        customerId, 
        note, 
        paidAt: new Date() 
      },
    });

    // ✅ Use receipt number as referenceNo instead of payment.id
    await recordCustomerLedger({
      customerId: customerId,
      transactionType: 'PAYMENT',
      date: payment.paidAt,
      saleId: saleId || null,
      paymentId: payment.id,
      returnId: null,
      debit: 0,
      credit: Number(amount),
      referenceNo: receiptNo,  // ← Human-readable!
      note: `Payment received - ${method}`,
      createdBy: null,
    });

    return payment;
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

    // ✅ Generate human-readable receipt number
    const receiptNo = await generateReceiptNumber(tx, 'RCPT');

    const payment = await tx.payment.create({
      data: { 
        direction: 'OUT', 
        method, 
        amount, 
        purchaseId, 
        supplierId, 
        note, 
        paidAt: new Date() 
      },
    });

    // ✅ Use receipt number as referenceNo
    await recordSupplierLedger({
      supplierId: supplierId,
      transactionType: 'PAYMENT',
      date: payment.paidAt,
      purchaseId: purchaseId || null,
      paymentId: payment.id,
      returnId: null,
      debit: 0,
      credit: Number(amount),
      referenceNo: receiptNo,  // ← Human-readable!
      note: `Payment made - ${method}`,
      createdBy: null,
    });

    return payment;
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

export async function getPayment(id) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { 
      customer: { select: { id: true, name: true, phone: true, email: true } },
      supplier: { select: { id: true, name: true, phone: true, email: true } },
      sale: { select: { id: true, invoiceNo: true } },
      purchase: { select: { id: true, invoiceNo: true } },
    },
  });
  
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}