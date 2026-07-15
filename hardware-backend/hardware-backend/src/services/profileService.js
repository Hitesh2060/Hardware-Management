import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';

const SALT_ROUNDS = 12;

export async function getMyProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
    omit: { passwordHash: true, refreshTokenHash: true, resetToken: true, emailVerifyToken: true },
  });
}

export async function updateMyProfile(userId, { name, phone }) {
  return prisma.user.update({ where: { id: userId }, data: { name, phone } });
}

/** Requires the current password — self-service change, distinct from admin reset. */
export async function changeMyPassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw ApiError.badRequest('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, refreshTokenHash: null } });
}

/** Sets/updates the avatar URL after a multer+Cloudinary upload (see config/multer.js). */
export async function updateMyAvatar(userId, avatarUrl) {
  // NOTE: requires an `avatarUrl` column on User — not yet in schema.prisma.
  // Add `avatarUrl String?` to the User model, then wire this in.
  throw ApiError.internal('Avatar upload not yet wired to a schema column — see profileService.js comment');
}
