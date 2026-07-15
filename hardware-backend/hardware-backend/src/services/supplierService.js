import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export async function createSupplier(data) {
  return prisma.supplier.create({ data });
}

export async function listSuppliers({ page = 1, limit = 20, search }) {
  // Parse and validate pagination parameters
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    isActive: true,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };
  
  const [items, total] = await Promise.all([
    prisma.supplier.findMany({ 
      where, 
      orderBy: { name: 'asc' }, 
      skip: skip, 
      take: parsedLimit 
    }),
    prisma.supplier.count({ where }),
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

export async function getSupplier(id) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { purchases: { orderBy: { purchaseDate: 'desc' }, take: 10 } },
  });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const due = await getSupplierOutstandingBalance(id);
  return { ...supplier, outstandingBalance: due };
}

export async function updateSupplier(id, data) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Supplier not found');
  return prisma.supplier.update({ where: { id }, data });
}

export async function deactivateSupplier(id) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Supplier not found');
  return prisma.supplier.update({ where: { id }, data: { isActive: false } });
}

/** Sum of unpaid purchase dueAmount for this supplier — used by Credit/Report modules. */
export async function getSupplierOutstandingBalance(supplierId) {
  const result = await prisma.purchase.aggregate({
    where: { supplierId, status: 'RECEIVED' },
    _sum: { dueAmount: true },
  });
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  return Number(result._sum.dueAmount || 0) + Number(supplier?.openingBalance || 0);
}