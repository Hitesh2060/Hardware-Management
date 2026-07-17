import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export async function createCustomer(data) {
  // Ensure numeric fields are properly parsed
  const cleanData = {
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    creditLimit: data.creditLimit ? Number(data.creditLimit) : 0,
    openingBalance: data.openingBalance ? Number(data.openingBalance) : 0,
  };
  
  return prisma.customer.create({ data: cleanData });
}

export async function listCustomers({ page = 1, limit = 20, search }) {
  // Parse and validate pagination parameters
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    isActive: true,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };
  
  const [items, total] = await Promise.all([
    prisma.customer.findMany({ 
      where, 
      orderBy: { name: 'asc' }, 
      skip: skip, 
      take: parsedLimit 
    }),
    prisma.customer.count({ where }),
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

export async function getCustomer(id) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { sales: { orderBy: { saleDate: 'desc' }, take: 10 } },
  });
  if (!customer) throw ApiError.notFound('Customer not found');

  const due = await getCustomerOutstandingBalance(id);
  return { ...customer, outstandingBalance: due };
}

export async function updateCustomer(id, data) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Customer not found');
  
  // Ensure numeric fields are properly parsed
  const cleanData = {
    ...data,
    creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
    openingBalance: data.openingBalance ? Number(data.openingBalance) : undefined,
  };
  
  return prisma.customer.update({ where: { id }, data: cleanData });
}

export async function deactivateCustomer(id) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Customer not found');
  return prisma.customer.update({ where: { id }, data: { isActive: false } });
}

/** Sum of unpaid sale dueAmount for this customer — used by Credit/Report modules. */
export async function getCustomerOutstandingBalance(customerId) {
  const result = await prisma.sale.aggregate({
    where: { customerId, status: 'COMPLETED' },
    _sum: { dueAmount: true },
  });
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  return Number(result._sum.dueAmount || 0) + Number(customer?.openingBalance || 0);
}