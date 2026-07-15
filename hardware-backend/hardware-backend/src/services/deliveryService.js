import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export async function createDelivery({ saleId, driverName, vehicleNo, address, scheduledDate, notes }) {
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) throw ApiError.badRequest('Invalid sale');

  const existing = await prisma.delivery.findUnique({ where: { saleId } });
  if (existing) throw ApiError.conflict('A delivery already exists for this sale');

  return prisma.delivery.create({
    data: { saleId, driverName, vehicleNo, address, scheduledDate, notes },
  });
}

export async function updateDeliveryStatus(id, status) {
  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) throw ApiError.notFound('Delivery not found');

  return prisma.delivery.update({
    where: { id },
    data: { status, deliveredAt: status === 'DELIVERED' ? new Date() : delivery.deliveredAt },
  });
}

export async function listDeliveries({ status, page = 1, limit = 20 }) {
  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: { sale: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.delivery.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getDelivery(id) {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { sale: { include: { customer: true, items: { include: { product: true } } } } },
  });
  if (!delivery) throw ApiError.notFound('Delivery not found');
  return delivery;
}
