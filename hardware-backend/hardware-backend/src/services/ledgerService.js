import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get complete supplier ledger with all transactions
 */
export async function getSupplierLedger(supplierId, { from, to } = {}) {
  // Check if supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  // Get all purchases (debits - what you owe)
  const purchases = await prisma.purchase.findMany({
    where: {
      supplierId,
      status: { not: 'CANCELLED' },
      ...(from || to ? { purchaseDate: { gte: from, lte: to } } : {}),
    },
    orderBy: { purchaseDate: 'asc' },
    include: { items: true },
  });

  // Get all payments made to supplier (credits - what you paid)
  const payments = await prisma.payment.findMany({
    where: {
      supplierId,
      direction: 'OUT',
      ...(from || to ? { paidAt: { gte: from, lte: to } } : {}),
    },
    orderBy: { paidAt: 'asc' },
  });

  // Build ledger entries
  const ledgerEntries = [];
  let runningBalance = Number(supplier.openingBalance) || 0;

  // Add opening balance
  if (runningBalance > 0) {
    ledgerEntries.push({
      date: supplier.createdAt,
      type: 'OPENING',
      reference: 'Opening Balance',
      debit: 0,
      credit: 0,
      balance: runningBalance,
      note: `Opening balance: Rs. ${runningBalance}`,
    });
  }

  // Add purchases
  for (const purchase of purchases) {
    runningBalance += Number(purchase.totalAmount);
    ledgerEntries.push({
      date: purchase.purchaseDate,
      type: 'PURCHASE',
      reference: purchase.invoiceNo,
      debit: Number(purchase.totalAmount),
      credit: 0,
      balance: runningBalance,
      note: `Purchase #${purchase.invoiceNo}`,
    });
  }

  // Add payments
  for (const payment of payments) {
    runningBalance -= Number(payment.amount);
    ledgerEntries.push({
      date: payment.paidAt,
      type: 'PAYMENT',
      reference: payment.id,
      debit: 0,
      credit: Number(payment.amount),
      balance: runningBalance,
      note: `Payment - ${payment.method}`,
    });
  }

  // Sort by date
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    supplier: {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
    },
    summary: {
      openingBalance: Number(supplier.openingBalance) || 0,
      totalPurchases: purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0),
      totalPayments: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      outstandingBalance: runningBalance,
    },
    entries: ledgerEntries,
  };
}

/**
 * Get supplier transaction summary (for dashboard)
 */
export async function getSupplierSummary(supplierId) {
  const [purchases, payments] = await Promise.all([
    prisma.purchase.aggregate({
      where: { supplierId, status: 'RECEIVED' },
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    }),
    prisma.payment.aggregate({
      where: { supplierId, direction: 'OUT' },
      _sum: { amount: true },
    }),
  ]);

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  return {
    supplierName: supplier?.name,
    totalPurchases: purchases._sum.totalAmount || 0,
    totalPaid: payments._sum.amount || 0,
    totalDue: purchases._sum.dueAmount || 0,
    openingBalance: supplier?.openingBalance || 0,
  };
}

export async function getCustomerLedger(customerId, { from, to } = {}) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) throw ApiError.notFound('Customer not found');

  // Get all sales (debits - what customer owes)
  const sales = await prisma.sale.findMany({
    where: {
      customerId,
      status: { not: 'CANCELLED' },
      ...(from || to ? { saleDate: { gte: from, lte: to } } : {}),
    },
    orderBy: { saleDate: 'asc' },
    include: { items: true },
  });

  // Get all payments received from customer (credits - what customer paid)
  const payments = await prisma.payment.findMany({
    where: {
      customerId,
      direction: 'IN',
      ...(from || to ? { paidAt: { gte: from, lte: to } } : {}),
    },
    orderBy: { paidAt: 'asc' },
  });

  const ledgerEntries = [];
  let runningBalance = Number(customer.openingBalance) || 0;

  // Opening balance (if any)
  if (runningBalance > 0) {
    ledgerEntries.push({
      date: customer.createdAt,
      type: 'OPENING',
      reference: 'Opening Balance',
      debit: 0,
      credit: 0,
      balance: runningBalance,
      note: `Opening balance: Rs. ${runningBalance}`,
    });
  }

  // Add sales (customer owes money -> debit increases)
  for (const sale of sales) {
    runningBalance += Number(sale.totalAmount);
    ledgerEntries.push({
      date: sale.saleDate,
      type: 'SALE',
      reference: sale.invoiceNo,
      debit: Number(sale.totalAmount),
      credit: 0,
      balance: runningBalance,
      note: `Sale #${sale.invoiceNo}`,
    });
  }

  // Add payments received (customer pays -> credit decreases balance)
  for (const payment of payments) {
    runningBalance -= Number(payment.amount);
    ledgerEntries.push({
      date: payment.paidAt,
      type: 'PAYMENT_RECEIVED',
      reference: payment.id,
      debit: 0,
      credit: Number(payment.amount),
      balance: runningBalance,
      note: `Payment - ${payment.method}`,
    });
  }

  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    summary: {
      openingBalance: Number(customer.openingBalance) || 0,
      totalSales: sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      totalPaymentsReceived: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      outstandingBalance: runningBalance,
    },
    entries: ledgerEntries,
  };
}

export async function getCustomerSummary(customerId) {
  const [sales, payments] = await Promise.all([
    prisma.sale.aggregate({
      where: { customerId, status: 'COMPLETED' },
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    }),
    prisma.payment.aggregate({
      where: { customerId, direction: 'IN' },
      _sum: { amount: true },
    }),
  ]);

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  return {
    customerName: customer?.name,
    totalSales: sales._sum.totalAmount || 0,
    totalPaid: payments._sum.amount || 0,
    totalDue: sales._sum.dueAmount || 0,
    openingBalance: customer?.openingBalance || 0,
  };
}