import prisma from '../config/database.js';
import { getCustomerOutstandingBalance } from './customerService.js';
import { getSupplierOutstandingBalance } from './supplierService.js';

/** "Customer Due" report — every customer with a non-zero outstanding balance. */
export async function getCustomerDueReport() {
  const customers = await prisma.customer.findMany({ where: { isActive: true } });
  const results = [];
  for (const c of customers) {
    const due = await getCustomerOutstandingBalance(c.id);
    if (due > 0) results.push({ customer: c, outstandingBalance: due });
  }
  return results.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
}

/** "Supplier Due" report — every supplier we still owe money to. */
export async function getSupplierDueReport() {
  const suppliers = await prisma.supplier.findMany({ where: { isActive: true } });
  const results = [];
  for (const s of suppliers) {
    const due = await getSupplierOutstandingBalance(s.id);
    if (due > 0) results.push({ supplier: s, outstandingBalance: due });
  }
  return results.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
}

/** Customers whose credit sales are past a simple "N days since sale" threshold, unpaid. */
export async function getOverdueCustomers(daysThreshold = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysThreshold);

  const overdueSales = await prisma.sale.findMany({
    where: { dueAmount: { gt: 0 }, saleDate: { lte: cutoff }, status: 'COMPLETED' },
    include: { customer: true },
    orderBy: { saleDate: 'asc' },
  });

  return overdueSales;
}
