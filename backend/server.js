import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import { createDatabaseIndexes } from './utils/database.js';

const backendDir = process.cwd();

// Load environment variables from backend/.env when running inside the backend folder
dotenv.config({ path: path.resolve(backendDir, '.env') });

// Create Express app
const app = express();

// Disable ETag generation for API responses so clients do not receive 304 Not Modified for JSON API endpoints
app.disable('etag');

// MongoDB connection
let db;
let client;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate limiting (configurable via env)
// Default: 1000 requests per 15 minutes = ~66 requests per minute = ~1.1 requests per second
// Allows bursts but prevents abuse
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000;

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    res.setHeader('Retry-After', Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Disable caching for API routes to avoid 304 responses being returned to the SPA
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Static file serving for uploads
// Ensure uploaded files always carry a permissive CORP header so the SPA (different origin/port)
// can load images without being blocked by the browser's resource policy.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

const isDevelopment = process.env.NODE_ENV !== 'production';

// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'backend-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

const morganStream = {
  write: (message) => logger.info(message.trim()),
};

const morganFormat = isDevelopment ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: morganStream }));

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import complaintRoutes from './routes/complaints.js';
import managementRoutes from './routes/management.js';
import technicianRoutes from './routes/technician.js';
import notificationRoutes from './routes/notifications.js';

// Routes
const attachDb = (req, res, next) => {
  const activeDb = db || req.app.locals.db;
  if (!activeDb) {
    return next(new Error('Database connection not available'));
  }

  req.app.locals.db = activeDb;
  next();
};

app.use('/api/auth', attachDb, authRoutes);
app.use('/api/users', attachDb, userRoutes);
app.use('/api/complaints', attachDb, complaintRoutes);
app.use('/api/management', attachDb, managementRoutes);
app.use('/api/technician', attachDb, technicianRoutes);
app.use('/api/notifications', attachDb, notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: db ? 'connected' : 'disconnected',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler (MUST have 4 parameters for Express to recognize it)
app.use((err, req, res, next) => {
  // Log the full error with stack trace
  logger.error('🔴 [ERROR]', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Don't expose stack trace in production
  const isDev = process.env.NODE_ENV !== 'production';
  const errorDetails = isDev ? { stack: err.stack, code: err.code } : {};

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit',
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      ...errorDetails,
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // MongoDB Duplicate Key Error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // MongoDB Validation Error
  if (err.name === 'MongoServerError' && err.code === 121) {
    return res.status(400).json({
      success: false,
      message: 'Document validation failed',
      ...errorDetails,
    });
  }

  // MongoDB Cast Error (Invalid ObjectId)
  if (err.name === 'BSONError' || err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
      ...errorDetails,
    });
  }

  // CORS Error
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
    });
  }

  // Database connection error
  if (err.message === 'Database connection not available') {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
    });
  }

  // Timeout errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return res.status(504).json({
      success: false,
      message: 'Request timeout',
    });
  }

  // Default 500 error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDev && { details: errorDetails }),
  });
});

// Database connection
const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/finalyearproject';

    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db();

    await createDatabaseIndexes(db);

    logger.info('MongoDB Connected Successfully');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

export const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(
      `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
    );
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🔴 [UNHANDLED REJECTION]', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
    timestamp: new Date().toISOString(),
  });
  // In production, you might want to exit the process
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('🔴 [UNCAUGHT EXCEPTION]', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
  });
  // Uncaught exceptions usually mean the process is in an unstable state
  process.exit(1);
});


export { db };
export default app;

