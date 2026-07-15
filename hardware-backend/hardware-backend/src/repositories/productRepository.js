import prisma from '../config/database.js';

/**
 * Repository layer: the ONLY place raw Prisma queries for Product live.
 * Services call this instead of `prisma.product.*` directly, so if the
 * persistence layer ever changes (e.g. adding caching, read replicas), only
 * this file needs to change.
 */

export const productRepository = {
  findBySku: (sku) => prisma.product.findUnique({ where: { sku } }),

  findById: (id) =>
    prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, unit: true },
    }),

  create: (data, tx = prisma) => tx.product.create({ data }),

  update: (id, data) => prisma.product.update({ where: { id }, data }),

  softDelete: (id) => prisma.product.update({ where: { id }, data: { isActive: false } }),

  findMany: async ({ page, limit, search, categoryId }) => {
    // Parse and validate pagination parameters
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, brand: true, unit: true },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parsedLimit,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  },
};