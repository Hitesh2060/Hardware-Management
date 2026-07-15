import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * Configured Cloudinary client. Only actually used if you swap
 * config/multer.js's diskStorage for `multer-storage-cloudinary` — kept
 * decoupled so local dev works with zero cloud credentials (falls back to
 * disk storage under /uploads).
 */
if (env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export default cloudinary;
