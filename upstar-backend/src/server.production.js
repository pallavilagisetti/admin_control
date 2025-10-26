const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { authenticateToken } = require('./middleware/auth');
const requestLogger = require('./middleware/requestLogger');
const { auditLoggers } = require('./middleware/auditLogger');
const { performanceLogger } = require('./middleware/performanceLogger');
const { validateInput, sanitizeInput, validateRateLimit } = require('./middleware/inputValidator');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const resumesRoutes = require('./routes/resumes');
const skillsRoutes = require('./routes/skills');
const jobsRoutes = require('./routes/jobs');
const analyticsRoutes = require('./routes/analytics');
const paymentsRoutes = require('./routes/payments');
const aiSettingsRoutes = require('./routes/ai-settings');
const systemHealthRoutes = require('./routes/system-health');
const notificationsRoutes = require('./routes/notifications');
const cmsRoutes = require('./routes/cms');
const dashboardRoutes = require('./routes/dashboard');
const jobQueueRoutes = require('./routes/job-queue');
const healthDetailedRoutes = require('./routes/health-detailed');
const fileUploadRoutes = require('./routes/file-upload');

// Import database connection
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Production-specific security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for production
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-domain.com',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000) || 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/health/detailed';
  }
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FILE_SIZE || '10mb' 
}));

// Logging middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
    stream: {
      write: (message) => {
        console.log(message.trim());
      }
    }
  }));
} else {
  app.use(morgan('dev'));
}

// Request logging middleware
app.use(requestLogger);

// Performance monitoring
app.use(performanceLogger);

// Audit logging
app.use(auditLoggers.requestLogger);
app.use(auditLoggers.responseLogger);

// Input validation middleware
app.use(validateInput);
app.use(sanitizeInput);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/resumes', authenticateToken, resumesRoutes);
app.use('/api/skills', authenticateToken, skillsRoutes);
app.use('/api/jobs', authenticateToken, jobsRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/payments', authenticateToken, paymentsRoutes);
app.use('/api/ai', authenticateToken, aiSettingsRoutes);
app.use('/api/system', authenticateToken, systemHealthRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/cms', authenticateToken, cmsRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/jobs/queue', authenticateToken, jobQueueRoutes);
app.use('/api/health/detailed', authenticateToken, healthDetailedRoutes);
app.use('/api/upload', authenticateToken, fileUploadRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Production server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


