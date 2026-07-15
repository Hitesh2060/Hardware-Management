import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as profileService from '../services/profileService.js';
import { logActivityNow } from '../middleware/activityLogger.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getMyProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, profile));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateMyProfile(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, profile, 'Profile updated'));
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  await profileService.changeMyPassword(req.user.id, req.body);
  await logActivityNow({ userId: req.user.id, module: 'Profile', action: 'CHANGE_PASSWORD', ipAddress: req.ip });
  res.status(200).json(new ApiResponse(200, null, 'Password changed. Please log in again.'));
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  // req.file.path / req.file.filename populated by multer (see middleware/upload.js)
  const avatarUrl = `/uploads/profiles/${req.file.filename}`;
  const profile = await profileService.updateMyAvatar(req.user.id, avatarUrl);
  res.status(200).json(new ApiResponse(200, profile, 'Avatar updated'));
});
