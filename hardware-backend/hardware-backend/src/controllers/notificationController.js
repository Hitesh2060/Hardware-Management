import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as notificationService from '../services/notificationService.js';

export const listMyNotifications = asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const notifications = await notificationService.listMyNotifications(req.user.id, { unreadOnly });
  res.status(200).json(new ApiResponse(200, notifications));
});

export const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, 'Marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});
