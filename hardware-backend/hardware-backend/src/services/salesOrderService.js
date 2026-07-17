import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { applySaleStock, applyCancellationReversal } from './stockService.js';
import { generateDocumentNumber } from '../utils/generateInvoiceNo.js';
import { recordCustomerLedger } from './ledgerService.js';

const TRANSACTION_TIMEOUT = 30000;

export async function createSale(payload, userId) {
  const { customerId, items, discountAmount, paidAmount, paymentMode, notes } = payload;

  return prisma.$transaction(async (tx) => {
    let customer = null;
    if (customerId) {
      customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer || !customer.isActive) throw ApiError.badRequest('Invalid customer');
    }

    let subTotal = 0;
    let taxAmount = 0;
    const lineData = [];

    const productIds = items.map(item => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, sellingPrice: true, isActive: true }
    });
    
    const productMap = new Map(products.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw ApiError.badRequest(`Invalid product: ${item.productId}`);
      }

      const gross = item.quantity * item.unitPrice;
      const lineTotal = gross - (item.discountAmount || 0) + (item.taxAmount || 0);

      subTotal += gross;
      taxAmount += item.taxAmount || 0;
      lineData.push({ 
        ...item, 
        lineTotal,
        discountAmount: item.discountAmount || 0,
        taxAmount: item.taxAmount || 0
      });
    }

    const totalAmount = subTotal - discountAmount + taxAmount;
    const dueAmount = totalAmount - paidAmount;

    if (paidAmount > totalAmount) {
      throw ApiError.badRequest('Paid amount cannot exceed total amount');
    }

    if (dueAmount > 0) {
      if (!customer) {
        throw ApiError.badRequest('A customer must be selected for credit/partial sales');
      }
      const existingDue = await getCustomerOutstandingBalance(tx, customer.id);
      const projectedDue = Number(existingDue) + dueAmount;
      if (Number(customer.creditLimit) > 0 && projectedDue > Number(customer.creditLimit)) {
        throw ApiError.badRequest(
          `This sale would push ${customer.name}'s outstanding balance to ${projectedDue.toFixed(2)}, ` +
            `exceeding their credit limit of ${customer.creditLimit}`
        );
      }
    }

    const invoiceNo = await generateDocumentNumber(tx, 'sale', 'INV');

    const validPaymentModes = ['CASH', 'CREDIT', 'PARTIAL', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET'];
    const safePaymentMode = validPaymentModes.includes(paymentMode) ? paymentMode : 'CASH';

    // ✅ STEP 1: Create the sale
    const sale = await tx.sale.create({
      data: {
        invoiceNo,
        customerId,
        subTotal,
        discountAmount: discountAmount || 0,
        taxAmount,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentMode: safePaymentMode,
        notes,
        createdById: userId,
        items: { create: lineData },
      },
      include: { items: true },
    });

    console.log('✅ Sale created with ID:', sale.id); // Debug log

    // ✅ STEP 2: Update stock
    for (const item of lineData) {
      await applySaleStock(tx, {
        productId: item.productId,
        quantity: item.quantity,
        saleId: sale.id,
        createdById: userId,
      });
    }

    // ✅ STEP 3: Record customer ledger entry (ONLY if customer exists AND sale exists)
    if (customerId && sale && sale.id) {
      try {
        // Double-check that the sale exists in the database
        const saleExists = await tx.sale.findUnique({
          where: { id: sale.id },
          select: { id: true },
        });

        if (saleExists) {
          await recordCustomerLedger({
            customerId: customerId,
            transactionType: 'SALE',
            date: sale.saleDate,
            saleId: sale.id,
            paymentId: null,
            returnId: null,
            debit: Number(sale.totalAmount),
            credit: 0,
            referenceNo: sale.invoiceNo,
            note: `Sale #${sale.invoiceNo}`,
            createdBy: userId,
          });
          console.log('✅ Customer ledger entry created for sale:', sale.id);
        } else {
          console.warn('⚠️ Sale not found when creating ledger entry');
        }
      } catch (ledgerError) {
        console.error('❌ Failed to create ledger entry:', ledgerError.message);
        // Don't throw - let the sale complete even if ledger fails
      }
    } else {
      console.log('ℹ️ Skipping ledger entry - no customer selected');
    }

    // ✅ STEP 4: Create payment (if any)
    if (paidAmount > 0) {
      let paymentMethod = 'CASH';
      const validPaymentMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET', 'CHEQUE'];
      if (validPaymentMethods.includes(paymentMode)) {
        paymentMethod = paymentMode;
      }

      await tx.payment.create({
        data: {
          direction: 'IN',
          method: paymentMethod,
          amount: paidAmount,
          saleId: sale.id,
          customerId,
          paidAt: new Date(),
        },
      });
    }

    return sale;
  }, {
    timeout: TRANSACTION_TIMEOUT,
    maxWait: TRANSACTION_TIMEOUT,
  });
}

async function getCustomerOutstandingBalance(tx, customerId) {
  const result = await tx.sale.aggregate({
    where: { customerId, status: 'COMPLETED' },
    _sum: { dueAmount: true },
  });
  return Number(result._sum.dueAmount ?? 0);
}

export async function getSale(id) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, customer: true, payments: true },
  });
  if (!sale) throw ApiError.notFound('Sale not found');
  return sale;
}

export async function listSales({ page, limit, customerId, from, to }) {
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    ...(customerId ? { customerId } : {}),
    ...(from || to ? { saleDate: { gte: from, lte: to } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { customer: true },
      orderBy: { saleDate: 'desc' },
      skip: skip,
      take: parsedLimit,
    }),
    prisma.sale.count({ where }),
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

export async function cancelSale(id, userId) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) throw ApiError.notFound('Sale not found');
    if (sale.status === 'CANCELLED') throw ApiError.badRequest('Sale already cancelled');

    for (const item of sale.items) {
      await applyCancellationReversal(tx, {
        productId: item.productId,
        quantity: item.quantity,
        originalType: 'SALE',
        referenceId: sale.id,
        createdById: userId,
      });
    }

    return tx.sale.update({ where: { id }, data: { status: 'CANCELLED' } });
  }, {
    timeout: TRANSACTION_TIMEOUT,
    maxWait: TRANSACTION_TIMEOUT,
  });
}