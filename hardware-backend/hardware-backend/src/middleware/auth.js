import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import prisma from '../config/database.js';

/**
 * Verifies the access token (Bearer header or httpOnly cookie), loads the
 * user + role + permissions, and attaches it to req.user.
 * Any downstream RBAC check (see rbac.middleware.js) relies on req.user.role.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const token = bearer || req.cookies?.accessToken;

  if (!token) {
    throw ApiError.unauthorized('Access token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token'
    );
  }

  // Retry logic for database connection
  let user = null;
  let retries = 3;
  
  while (retries > 0 && !user) {
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });
    } catch (error) {
      retries--;
      console.log(`Database connection retry... (${retries} attempts left)`);
      if (retries === 0) {
        console.error('Database connection failed after 3 retries:', error.message);
        throw ApiError.internal('Database connection error. Please try again.');
      }
      // Wait 500ms before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User no longer active');
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.code),
  };

  next();
});