import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import routes from './routes/index.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { env } from './config/env.js';

const app = express();

app.use(
  cors({
    origin: env.cors.origin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestLogger);
app.use('/api', apiLimiter);

// Serves uploaded product images / generated invoices directly (dev/local-disk
// storage mode — see config/multer.js). In production behind Nginx, this
// path is typically served directly by Nginx instead for performance.
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/v1', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware); // must be registered last

export default app;
