import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/authService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(new ApiResponse(201, result, 'User registered. Please verify email.'));
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  await logActivityNow({ userId: user.id, module: 'Auth', action: 'LOGIN', ipAddress: req.ip });

  res.status(200).json(new ApiResponse(200, { accessToken, user }, 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const oldToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(oldToken);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.id);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.status(200).json(new ApiResponse(200, null, 'Logged out'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  // Generic message regardless of whether the email exists — prevents enumeration.
  res.status(200).json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(200).json(new ApiResponse(200, null, 'Password reset successful'));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.status(200).json(new ApiResponse(200, null, 'Email verified'));
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Current user'));
});
