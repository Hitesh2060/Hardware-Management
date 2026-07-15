/**
 * Mirrors the roles created in prisma/seeds/adminSeeder.js. Import these
 * instead of hardcoding role-name strings in requireRole() calls, so a
 * typo becomes a build-time reference error instead of a silent 403.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  STOCK_KEEPER: 'STOCK_KEEPER',
});
