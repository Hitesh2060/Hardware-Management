import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export async function createExpense({ category, amount, expenseDate, note }) {
  return prisma.expense.create({ data: { category, amount, expenseDate, note } });
}

export async function listExpenses({ from, to, category, page = 1, limit = 20 }) {
  const where = {
    ...(from || to ? { expenseDate: { gte: from, lte: to } } : {}),
    ...(category ? { category } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.expense.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function deleteExpense(id) {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Expense not found');
  return prisma.expense.delete({ where: { id } });
}
