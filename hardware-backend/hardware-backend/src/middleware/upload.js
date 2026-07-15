import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { productImageUpload, profileImageUpload, invoiceUpload } from '../config/multer.js';

/**
 * Wraps a multer single-file middleware so its errors flow through the same
 * ApiError -> errorHandler.js pipeline as everything else, instead of
 * multer's raw error shape.
 *
 * Usage: router.post('/:id/image', uploadSingle(productImageUpload, 'image'), controller)
 */
export const uploadSingle = (uploader, fieldName) => (req, res, next) => {
  uploader.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(ApiError.badRequest(`Upload failed: ${err.message}`));
    }
    if (err) return next(ApiError.badRequest(err.message));
    next();
  });
};

export const uploadProductImage = uploadSingle(productImageUpload, 'image');
export const uploadProfileImage = uploadSingle(profileImageUpload, 'avatar');
export const uploadInvoiceFile = uploadSingle(invoiceUpload, 'file');
