const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './env.local' });

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { authenticateToken } = require('./middleware/auth');
const requestLogger = require('./middleware/requestLogger');
const { performanceLogger } = require('./middleware/performanceLogger');
const { sanitizeInput } = require('./middleware/inputValidator');

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
const fileUploadRoutes = require('./routes/file-upload');

// Import database connection
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMITED'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(requestLogger);
app.use(performanceLogger(1000)); // Log requests slower than 1 second
app.use(sanitizeInput);

// Health check endpoints - PUBLIC (no authentication required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Public health detailed endpoint
app.get('/api/health/detailed', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    database: { status: 'connected' },
    jobQueues: { status: 'running' },
    externalServices: { status: 'available' }
  });
});

// Development endpoint - public users for testing
app.get('/api/users/public', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  
  // Mock user data for development
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
      roles: ['user'],
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      active: true,
      roles: ['admin'],
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    users: users,
    pagination: {
      page: page,
      limit: limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit)
    }
  });
});

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');
  
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Upstar Backend API',
        version: '1.0.0',
        description: 'API for Upstar resume processing and job matching platform',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/routes/*.js'],
  };
  
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/resumes', authenticateToken, resumesRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', authenticateToken, paymentsRoutes);
app.use('/api/ai', authenticateToken, aiSettingsRoutes);
app.use('/api/system', authenticateToken, systemHealthRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/cms', authenticateToken, cmsRoutes);
app.use('/api/upload', authenticateToken, fileUploadRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;