import logger from '../utils/logger.js';

/**
 * Lightweight access logger (avoids adding morgan as a dependency just for
 * this). Logs method, path, status, and response time for every request to
 * logs/combined.log (via the shared winston logger) — separate from
 * errorHandler.js, which only logs failures.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${req.ip}`;
    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else logger.info(line);
  });
  next();
};
