import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';

const SALT_ROUNDS = 12;

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, roleId: user.roleId }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
  });
}

export async function registerUser({ name, email, phone, password, roleId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.badRequest('Invalid role');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, roleId, emailVerifyToken },
  });

  await sendVerificationEmail(email, emailVerifyToken);

  return { id: user.id, name: user.name, email: user.email };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash, lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
  };
}

/** Rotates the refresh token: verifies the old one, issues a brand new pair. */
export async function refreshAccessToken(oldRefreshToken) {
  if (!oldRefreshToken) throw ApiError.unauthorized('Refresh token missing');

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, env.jwt.refreshSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Session no longer valid, please log in again');
  }

  const matches = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash);
  if (!matches) {
    // Possible token reuse/theft — invalidate the session entirely.
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
    throw ApiError.unauthorized('Refresh token reuse detected — please log in again');
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  const refreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(userId) {
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond the same way whether or not the email exists (prevents
  // account enumeration) — controller handles the generic success message.
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  await sendPasswordResetEmail(email, resetToken);
}

export async function resetPassword({ token, newPassword }) {
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null, refreshTokenHash: null },
  });
}

export async function verifyEmail(token) {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw ApiError.badRequest('Invalid verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });
}
