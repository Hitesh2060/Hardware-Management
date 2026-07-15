import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

const SALT_ROUNDS = 12;

export async function listUsers({ page = 1, limit = 20 }) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      // never leak passwordHash/refreshTokenHash to the client
      omit: { passwordHash: true, refreshTokenHash: true, resetToken: true, emailVerifyToken: true },
    }),
    prisma.user.count(),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
    omit: { passwordHash: true, refreshTokenHash: true, resetToken: true, emailVerifyToken: true },
  });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function updateUserRole(id, roleId) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.badRequest('Invalid role');
  return prisma.user.update({ where: { id }, data: { roleId } });
}

export async function setUserActive(id, isActive) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export async function adminResetPassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id }, data: { passwordHash, refreshTokenHash: null } });
}

export async function listRoles() {
  return prisma.role.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}
