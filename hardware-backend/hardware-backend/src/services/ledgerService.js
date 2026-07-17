import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { Prisma } from '@prisma/client';

// ============================================
// 1. LEDGER TABLE OPERATIONS
// ============================================

export async function recordCustomerLedger({
  customerId,
  transactionType,
  date,
  saleId = null,
  paymentId = null,
  returnId = null,
  debit = 0,
  credit = 0,
  referenceNo,
  note = null,
  createdBy = null,
}) {
  try {
    return await prisma.customerLedger.create({
      data: {
        customerId,
        transactionType,
        date: new Date(date),
        saleId,
        paymentId,
        returnId,
        debit,
        credit,
        referenceNo,
        note,
        createdBy,
      },
    });
  } catch (err) {
    // Log the error with details
    console.error('❌ Ledger creation failed:', {
      error: err.message,
      code: err.code,
      meta: err.meta,
      customerId,
      saleId,
      transactionType,
    });
    
    if (err.code === 'P2002') {
      throw ApiError.badRequest(
        `This transaction (${referenceNo}) has already been posted to the customer ledger`
      );
    }
    
    throw err;
  }
}
export async function recordSupplierLedger({
  supplierId,
  transactionType,
  date,
  purchaseId = null,
  paymentId = null,
  returnId = null,
  debit = 0,
  credit = 0,
  referenceNo,
  note = null,
  createdBy = null,
}) {
  try {
    return await prisma.supplierLedger.create({
      data: {
        supplierId,
        transactionType,
        date: new Date(date),
        purchaseId,
        paymentId,
        returnId,
        debit,
        credit,
        referenceNo,
        note,
        createdBy,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw ApiError.badRequest(
        `This transaction (${referenceNo}) has already been posted to the supplier ledger`
      );
    }
    throw err;
  }
}

// ============================================
// 2. CUSTOMER LEDGER
// ============================================
/**
 * Calculate aging breakdown for a customer
 */
export function calculateAging(transactions) {
  const now = new Date();
  const aging = {
    current: 0,      // 0-30 days
    overdue30: 0,    // 31-60 days
    overdue60: 0,    // 61-90 days
    overdue90: 0,    // 90+ days
  };

  for (const tx of transactions) {
    if (tx.transactionType === 'SALE' && tx.dueAmount > 0) {
      const daysDiff = Math.floor((now - new Date(tx.date)) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 30) aging.current += Number(tx.dueAmount);
      else if (daysDiff <= 60) aging.overdue30 += Number(tx.dueAmount);
      else if (daysDiff <= 90) aging.overdue60 += Number(tx.dueAmount);
      else aging.overdue90 += Number(tx.dueAmount);
    }
  }

  return aging;
}

export async function getCustomerLedger(customerId, { page = 1, limit = 50, from, to }) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw ApiError.notFound('Customer not found');

  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 50));
  const skip = (parsedPage - 1) * parsedLimit;

  // Get entries with pagination
  const entries = await prisma.customerLedger.findMany({
    where: {
      customerId,
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
    },
    orderBy: { date: 'desc' },
    skip: skip,
    take: parsedLimit,
  });

  // Get all entries for running balance calculation
  const allEntries = await prisma.customerLedger.findMany({
    where: { customerId },
    orderBy: { date: 'asc' },
    select: { id: true, debit: true, credit: true, transactionType: true, date: true },
  });

  let runningBalance = 0;
  let openingBalance = 0;
  const balanceMap = new Map();

  for (const entry of allEntries) {
    runningBalance += Number(entry.debit) - Number(entry.credit);
    balanceMap.set(entry.id, runningBalance);
    
    if (entry.transactionType === 'OPENING_BALANCE') {
      openingBalance = Number(entry.debit) || 0;
    }
  }

  const entriesWithBalance = entries.map(entry => {
    const balance = balanceMap.get(entry.id) || 0;
    return {
      ...entry,
      runningBalance: balance,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      // Determine transaction direction for styling
      direction: entry.debit > 0 ? 'debit' : (entry.credit > 0 ? 'credit' : 'neutral'),
      // Format date with time
      formattedDate: new Date(entry.date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });

  const total = await prisma.customerLedger.count({
    where: {
      customerId,
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
    },
  });

  const balanceResult = await prisma.customerLedger.aggregate({
    where: { customerId },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  const totalDebit = balanceResult._sum.debit || 0;
  const totalCredit = balanceResult._sum.credit || 0;
  const currentBalance = totalDebit - totalCredit;

  // Get sales for aging calculation
  const sales = await prisma.sale.findMany({
    where: { 
      customerId, 
      status: 'COMPLETED',
      dueAmount: { gt: 0 }
    },
    select: { dueAmount: true, saleDate: true },
  });

  // Calculate aging
  const aging = calculateAging(sales);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    openingBalance: openingBalance || Number(customer.openingBalance) || 0,
    entries: entriesWithBalance,
    totalDebit: Number(totalDebit),
    totalCredit: Number(totalCredit),
    currentBalance: Number(currentBalance),
    aging,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

export async function getCustomerLedgerSummary(customerId) {
  const [entries, customer] = await Promise.all([
    prisma.customerLedger.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
    }),
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, phone: true, email: true },
    }),
  ]);

  if (!customer) throw ApiError.notFound('Customer not found');

  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);
  const balance = totalDebit - totalCredit;

  return {
    customer,
    totalDebit,
    totalCredit,
    balance,
    transactionCount: entries.length,
  };
}

// ============================================
// 3. SUPPLIER LEDGER
// ============================================

export async function getSupplierLedger(supplierId, { page = 1, limit = 50, from, to }) {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 50));
  const skip = (parsedPage - 1) * parsedLimit;

  // ✅ Get entries with pagination using findMany (same as customer)
  const entries = await prisma.supplierLedger.findMany({
    where: {
      supplierId,
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
    },
    orderBy: { date: 'desc' },
    skip: skip,
    take: parsedLimit,
  });

  // ✅ Get all entries for running balance calculation
  const allEntries = await prisma.supplierLedger.findMany({
    where: { supplierId },
    orderBy: { date: 'asc' },
    select: { id: true, debit: true, credit: true, transactionType: true, date: true },
  });

  let runningBalance = 0;
  let openingBalance = 0;
  const balanceMap = new Map();

  for (const entry of allEntries) {
    runningBalance += Number(entry.debit) - Number(entry.credit);
    balanceMap.set(entry.id, runningBalance);
    
    if (entry.transactionType === 'OPENING_BALANCE') {
      openingBalance = Number(entry.debit) || 0;
    }
  }

  const entriesWithBalance = entries.map(entry => {
    const balance = balanceMap.get(entry.id) || 0;
    return {
      ...entry,
      runningBalance: balance,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      direction: entry.debit > 0 ? 'debit' : (entry.credit > 0 ? 'credit' : 'neutral'),
      formattedDate: new Date(entry.date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });

  const total = await prisma.supplierLedger.count({
    where: {
      supplierId,
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
    },
  });

  const balanceResult = await prisma.supplierLedger.aggregate({
    where: { supplierId },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  const totalDebit = balanceResult._sum.debit || 0;
  const totalCredit = balanceResult._sum.credit || 0;
  const currentBalance = totalDebit - totalCredit;

  return {
    supplier: {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
    },
    openingBalance: openingBalance || Number(supplier.openingBalance) || 0,
    entries: entriesWithBalance,
    totalDebit: Number(totalDebit),
    totalCredit: Number(totalCredit),
    currentBalance: Number(currentBalance),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

export async function getSupplierLedgerSummary(supplierId) {
  const [entries, supplier] = await Promise.all([
    prisma.supplierLedger.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' },
    }),
    prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { name: true, phone: true, email: true },
    }),
  ]);

  if (!supplier) throw ApiError.notFound('Supplier not found');

  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);
  const balance = totalDebit - totalCredit;

  return {
    supplier,
    totalDebit,
    totalCredit,
    balance,
    transactionCount: entries.length,
  };
}

// ============================================
// 4. REBUILD LEDGER
// ============================================

export async function rebuildCustomerLedger(customerId) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw ApiError.notFound('Customer not found');

  const sales = await prisma.sale.findMany({
    where: { customerId, status: 'COMPLETED' },
    orderBy: { saleDate: 'asc' },
    select: { id: true, saleDate: true, totalAmount: true, invoiceNo: true },
  });

  const payments = await prisma.payment.findMany({
    where: { customerId, direction: 'IN' },
    orderBy: { paidAt: 'asc' },
    select: { id: true, paidAt: true, amount: true },
  });

  const entries = [];

  const opening = Number(customer.openingBalance) || 0;
  if (opening !== 0) {
    entries.push({
      customerId,
      transactionType: 'OPENING_BALANCE',
      date: customer.createdAt,
      saleId: null,
      paymentId: null,
      returnId: null,
      debit: opening > 0 ? opening : 0,
      credit: opening < 0 ? Math.abs(opening) : 0,
      referenceNo: `OPENING-${customerId}`,
      note: 'Opening balance',
      createdBy: null,
    });
  }

  for (const sale of sales) {
    entries.push({
      customerId,
      transactionType: 'SALE',
      date: sale.saleDate,
      saleId: sale.id,
      paymentId: null,
      returnId: null,
      debit: Number(sale.totalAmount),
      credit: 0,
      referenceNo: sale.invoiceNo,
      note: `Sale #${sale.invoiceNo}`,
      createdBy: null,
    });
  }
  const totalPayments = await prisma.payment.count({
    where: { direction: 'IN' },
  });

  let paymentCounter = totalPayments - payments.length + 1;

  for (const payment of payments) {
    const year = new Date(payment.paidAt).getFullYear();
   
    const receiptNo = `RCPT-${year}-${paymentCounter}`;
    
    entries.push({
      customerId,
      transactionType: 'PAYMENT',
      date: payment.paidAt,
      saleId: null,
      paymentId: payment.id,
      returnId: null,
      debit: 0,
      credit: Number(payment.amount),
      referenceNo: receiptNo,
      note: 'Payment received',
      createdBy: null,
    });
    
    paymentCounter++;
  }

  await prisma.$transaction([
    prisma.customerLedger.deleteMany({ where: { customerId } }),
    ...(entries.length
      ? [
          prisma.customerLedger.createMany({
            data: entries.map((e) => ({ ...e, date: new Date(e.date) })),
          }),
        ]
      : []),
  ]);

  return {
    success: true,
    sales: sales.length,
    payments: payments.length,
    openingBalanceApplied: opening !== 0,
    totalEntries: entries.length,
  };
}

export async function rebuildSupplierLedger(supplierId) {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const purchases = await prisma.purchase.findMany({
    where: { supplierId, status: 'RECEIVED' },
    orderBy: { purchaseDate: 'asc' },
    select: { id: true, purchaseDate: true, totalAmount: true, invoiceNo: true },
  });

  const payments = await prisma.payment.findMany({
    where: { supplierId, direction: 'OUT' },
    orderBy: { paidAt: 'asc' },
    select: { id: true, paidAt: true, amount: true },
  });

  const entries = [];

  const opening = Number(supplier.openingBalance) || 0;
  if (opening !== 0) {
    entries.push({
      supplierId,
      transactionType: 'OPENING_BALANCE',
      date: supplier.createdAt,
      purchaseId: null,
      paymentId: null,
      returnId: null,
      debit: opening > 0 ? opening : 0,
      credit: opening < 0 ? Math.abs(opening) : 0,
      referenceNo: `OPENING-${supplierId}`,
      note: 'Opening balance',
      createdBy: null,
    });
  }

  for (const purchase of purchases) {
    entries.push({
      supplierId,
      transactionType: 'PURCHASE',
      date: purchase.purchaseDate,
      purchaseId: purchase.id,
      paymentId: null,
      returnId: null,
      debit: Number(purchase.totalAmount),
      credit: 0,
      referenceNo: purchase.invoiceNo,
      note: `Purchase #${purchase.invoiceNo}`,
      createdBy: null,
    });
  }

 
  const totalPayments = await prisma.payment.count({
    where: { direction: 'OUT' },
  });

  let paymentCounter = totalPayments - payments.length + 1;

  for (const payment of payments) {
    const year = new Date(payment.paidAt).getFullYear();
    const receiptNo = `RCPT-${year}-${paymentCounter}`;
    
    entries.push({
      supplierId,
      transactionType: 'PAYMENT',
      date: payment.paidAt,
      purchaseId: null,
      paymentId: payment.id,
      returnId: null,
      debit: 0,
      credit: Number(payment.amount),
      referenceNo: receiptNo,
      note: 'Payment made',
      createdBy: null,
    });
    
    paymentCounter++;
  }

  await prisma.$transaction([
    prisma.supplierLedger.deleteMany({ where: { supplierId } }),
    ...(entries.length
      ? [
          prisma.supplierLedger.createMany({
            data: entries.map((e) => ({ ...e, date: new Date(e.date) })),
          }),
        ]
      : []),
  ]);

  return {
    success: true,
    purchases: purchases.length,
    payments: payments.length,
    openingBalanceApplied: opening !== 0,
    totalEntries: entries.length,
  };
}