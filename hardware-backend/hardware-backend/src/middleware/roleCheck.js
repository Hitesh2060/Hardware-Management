import ApiError from '../utils/ApiError.js';

/**
 * Usage: router.post('/products', authenticate, requirePermission('product.create'), controller)
 *
 * Permissions are seeded per role (prisma/seed.js) as fine-grained codes like
 * "product.create", "sale.void", "report.export". ADMIN role gets all of them.
 * Pass multiple codes to require ANY one of them (e.g. read access shared by
 * several roles): requirePermission('sale.view', 'dashboard.view')
 */
export const requirePermission = (...permissionCodes) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }

  const hasPermission = permissionCodes.some((code) => req.user.permissions.includes(code));

  if (!hasPermission) {
    return next(
      ApiError.forbidden(
        `You do not have permission to perform this action (requires: ${permissionCodes.join(' or ')})`
      )
    );
  }

  next();
};

/** Convenience guard for endpoints restricted to specific role names. */
export const requireRole = (...roleNames) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Not authenticated'));
  if (!roleNames.includes(req.user.roleName)) {
    return next(ApiError.forbidden(`This action requires role: ${roleNames.join(' or ')}`));
  }
  next();
};
