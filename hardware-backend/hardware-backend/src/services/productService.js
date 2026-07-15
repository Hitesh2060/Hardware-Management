import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { productRepository } from '../repositories/productRepository.js';
import { getCurrentStock, applyOpeningStock } from './stockService.js';

export async function createProduct(payload, userId) {
  const existingSku = await productRepository.findBySku(payload.sku);
  if (existingSku) throw ApiError.conflict(`SKU "${payload.sku}" already exists`);

  const { openingStock, ...productData } = payload;

  // Product creation + opening stock movement must succeed or fail together.
  return prisma.$transaction(async (tx) => {
    const product = await productRepository.create(productData, tx);

    if (openingStock && openingStock > 0) {
      await applyOpeningStock(tx, {
        productId: product.id,
        quantity: openingStock,
        createdById: userId,
      });
    }

    return product;
  });
}

export async function getProduct(id) {
  const product = await productRepository.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  const currentStock = await getCurrentStock(prisma, id);
  return { ...product, currentStock };
}

export async function updateProduct(id, payload) {
  const existing = await productRepository.findById(id);
  if (!existing) throw ApiError.notFound('Product not found');
  return productRepository.update(id, payload);
}

export async function deactivateProduct(id) {
  const existing = await productRepository.findById(id);
  if (!existing) throw ApiError.notFound('Product not found');
  return productRepository.softDelete(id);
}

export async function listProducts({ page, limit, search, categoryId, lowStockOnly }) {
  const { items, total } = await productRepository.findMany({ page, limit, search, categoryId });

  // Attach current stock to each row. For large catalogs this should be
  // replaced with a materialized "current_stock" view refreshed by a
  // trigger — noted in the Future Scalability plan — but the aggregate
  // approach is correct and simple for a single hardware shop's catalog size.
  const withStock = await Promise.all(
    items.map(async (p) => ({ ...p, currentStock: await getCurrentStock(prisma, p.id) }))
  );

  const filtered = lowStockOnly
    ? withStock.filter((p) => Number(p.currentStock) <= p.reorderLevel)
    : withStock;

  return {
    items: filtered,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
