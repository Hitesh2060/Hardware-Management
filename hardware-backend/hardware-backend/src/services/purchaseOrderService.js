import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { applyPurchaseStock, applyCancellationReversal } from './stockService.js';
import { generateDocumentNumber } from '../utils/generateInvoiceNo.js';
import { recordSupplierLedger } from './ledgerService.js'; // ✅ ADD THIS IMPORT

export async function createPurchase(payload, userId) {
  const { supplierId, items, discountAmount, transportCharge, paidAmount, notes, status = 'DRAFT' } = payload;

  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier || !supplier.isActive) throw ApiError.badRequest('Invalid supplier');

    let subTotal = 0;
    let taxAmount = 0;
    const lineData = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        throw ApiError.badRequest(`Invalid product: ${item.productId}`);
      }

      const gross = item.quantity * item.unitCost;
      const lineTotal = gross - (item.discountAmount || 0) + (item.taxAmount || 0);

      subTotal += gross;
      taxAmount += item.taxAmount || 0;
      lineData.push({ ...item, lineTotal });
    }

    const totalAmount = subTotal - discountAmount + taxAmount + transportCharge;
    const dueAmount = totalAmount - (paidAmount || 0);

    if (paidAmount > totalAmount) {
      throw ApiError.badRequest('Paid amount cannot exceed total amount');
    }

    const invoiceNo = await generateDocumentNumber(tx, 'purchase', 'PUR');

    const purchase = await tx.purchase.create({
      data: {
        invoiceNo,
        supplierId,
        subTotal,
        discountAmount: discountAmount || 0,
        taxAmount,
        transportCharge: transportCharge || 0,
        totalAmount,
        paidAmount: paidAmount || 0,
        dueAmount: dueAmount,
        notes,
        status: status,
        createdById: userId,
        items: { create: lineData },
      },
      include: { items: true },
    });

    // Only apply stock if status is RECEIVED
    if (status === 'RECEIVED') {
      for (const item of lineData) {
        await applyPurchaseStock(tx, {
          productId: item.productId,
          quantity: item.quantity,
          purchaseId: purchase.id,
          createdById: userId,
        });
      }

      // ✅ RECORD SUPPLIER LEDGER ENTRY FOR PURCHASE
      await recordSupplierLedger({
        supplierId: supplierId,
        transactionType: 'PURCHASE',
        date: purchase.purchaseDate,
        purchaseId: purchase.id,
        paymentId: null,
        returnId: null,
        debit: Number(purchase.totalAmount),
        credit: 0,
        referenceNo: purchase.invoiceNo,
        note: `Purchase #${purchase.invoiceNo}`,
        createdBy: userId,
      });

      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            direction: 'OUT',
            method: 'CASH',
            amount: paidAmount,
            purchaseId: purchase.id,
            supplierId,
            paidAt: new Date(),
          },
        });
      }
    }

    return purchase;
  });
}

/**
 * Confirm/Receive a DRAFT purchase - this updates stock and records payment
 */
export async function receivePurchase(id, userId) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!purchase) throw ApiError.notFound('Purchase not found');
    if (purchase.status === 'RECEIVED') throw ApiError.badRequest('Purchase already received');
    if (purchase.status === 'CANCELLED') throw ApiError.badRequest('Purchase is cancelled');

    // Apply stock for all items
    for (const item of purchase.items) {
      await applyPurchaseStock(tx, {
        productId: item.productId,
        quantity: item.quantity,
        purchaseId: purchase.id,
        createdById: userId,
      });
    }

    // ✅ RECORD SUPPLIER LEDGER ENTRY FOR PURCHASE (when receiving draft)
    await recordSupplierLedger({
      supplierId: purchase.supplierId,
      transactionType: 'PURCHASE',
      date: purchase.purchaseDate,
      purchaseId: purchase.id,
      paymentId: null,
      returnId: null,
      debit: Number(purchase.totalAmount),
      credit: 0,
      referenceNo: purchase.invoiceNo,
      note: `Purchase #${purchase.invoiceNo} (received from draft)`,
      createdBy: userId,
    });

    // Create payment record if any amount was paid
    if (purchase.paidAmount > 0) {
      await tx.payment.create({
        data: {
          direction: 'OUT',
          method: 'CASH',
          amount: purchase.paidAmount,
          purchaseId: purchase.id,
          supplierId: purchase.supplierId,
          paidAt: new Date(),
        },
      });
    }

    return tx.purchase.update({
      where: { id },
      data: { status: 'RECEIVED' },
    });
  });
}

export async function getPurchase(id) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, supplier: true, payments: true },
  });
  if (!purchase) throw ApiError.notFound('Purchase not found');
  return purchase;
}

export async function listPurchases({ page, limit, supplierId, from, to, status }) {
  // Parse and validate pagination parameters
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    ...(supplierId ? { supplierId } : {}),
    ...(status ? { status } : {}),
    ...(from || to ? { purchaseDate: { gte: from, lte: to } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { 
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { purchaseDate: 'desc' },
      skip: skip,
      take: parsedLimit,
    }),
    prisma.purchase.count({ where }),
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

export async function cancelPurchase(id, userId) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id }, include: { items: true } });
    if (!purchase) throw ApiError.notFound('Purchase not found');
    if (purchase.status === 'CANCELLED') throw ApiError.badRequest('Purchase already cancelled');

    // If purchase was already RECEIVED, reverse the stock
    if (purchase.status === 'RECEIVED') {
      for (const item of purchase.items) {
        await applyCancellationReversal(tx, {
          productId: item.productId,
          quantity: item.quantity,
          originalType: 'PURCHASE',
          referenceId: purchase.id,
          createdById: userId,
        });
      }
    }

    return tx.purchase.update({ where: { id }, data: { status: 'CANCELLED' } });
  });
}

/**
 * Update a DRAFT purchase (add/remove items, change quantities)
 */
export async function updateDraftPurchase(id, payload, userId) {
  const { supplierId, items, discountAmount, transportCharge, paidAmount, notes } = payload;

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!purchase) throw ApiError.notFound('Purchase not found');
    if (purchase.status !== 'DRAFT') {
      throw ApiError.badRequest('Only DRAFT purchases can be edited');
    }

    // Delete existing items
    await tx.purchaseItem.deleteMany({
      where: { purchaseId: id },
    });

    // Recalculate totals
    let subTotal = 0;
    let taxAmount = 0;
    const lineData = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        throw ApiError.badRequest(`Invalid product: ${item.productId}`);
      }

      const gross = item.quantity * item.unitCost;
      const lineTotal = gross - (item.discountAmount || 0) + (item.taxAmount || 0);

      subTotal += gross;
      taxAmount += item.taxAmount || 0;
      lineData.push({ ...item, lineTotal });
    }

    const totalAmount = subTotal - discountAmount + taxAmount + transportCharge;
    const dueAmount = totalAmount - (paidAmount || 0);

    if (paidAmount > totalAmount) {
      throw ApiError.badRequest('Paid amount cannot exceed total amount');
    }

    // Update purchase with new data including paidAmount
    return tx.purchase.update({
      where: { id },
      data: {
        supplierId,
        subTotal,
        discountAmount: discountAmount || 0,
        taxAmount,
        transportCharge: transportCharge || 0,
        totalAmount,
        paidAmount: paidAmount || 0,
        dueAmount: dueAmount,
        notes,
        items: { create: lineData },
      },
      include: { items: true },
    });
  });
}