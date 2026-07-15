import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/userService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  res.status(200).json(new ApiResponse(200, result));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.status(200).json(new ApiResponse(200, user));
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.roleId);
  await logActivityNow({ userId: req.user.id, module: 'User', action: 'UPDATE_ROLE', entityId: user.id, ipAddress: req.ip });
  res.status(200).json(new ApiResponse(200, user, 'User role updated'));
});

export const setUserActive = asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, req.body.isActive);
  await logActivityNow({
    userId: req.user.id,
    module: 'User',
    action: req.body.isActive ? 'ACTIVATE' : 'DEACTIVATE',
    entityId: user.id,
    ipAddress: req.ip,
  });
  res.status(200).json(new ApiResponse(200, user, `User ${req.body.isActive ? 'activated' : 'deactivated'}`));
});

export const adminResetPassword = asyncHandler(async (req, res) => {
  await userService.adminResetPassword(req.params.id, req.body.newPassword);
  await logActivityNow({ userId: req.user.id, module: 'User', action: 'ADMIN_RESET_PASSWORD', entityId: req.params.id, ipAddress: req.ip });
  res.status(200).json(new ApiResponse(200, null, 'Password reset. All sessions invalidated.'));
});

export const listRoles = asyncHandler(async (req, res) => {
  const roles = await userService.listRoles();
  res.status(200).json(new ApiResponse(200, roles));
});
