import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

/** General API limiter — generous, just guards against runaway clients/bugs. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest('Too many requests, please slow down and try again shortly')),
});

/**
 * Strict limiter for auth endpoints (login/forgot-password) — the classic
 * brute-force / credential-stuffing / enumeration mitigation.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(ApiError.badRequest('Too many attempts. Please try again in 15 minutes.')),
});
