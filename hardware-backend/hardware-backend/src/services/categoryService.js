import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export async function createCategory({ name, parentId }) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw ApiError.conflict(`Category "${name}" already exists`);
  return prisma.category.create({ data: { name, parentId } });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getCategory(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { children: true, products: true },
  });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

export async function updateCategory(id, data) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Category not found');
  return prisma.category.update({ where: { id }, data });
}

export async function deactivateCategory(id) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Category not found');
  return prisma.category.update({ where: { id }, data: { isActive: false } });
}
