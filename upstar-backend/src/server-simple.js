const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic dashboard endpoint
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    totalUsers: 1250,
    activeUsers: 980,
    totalRevenue: 45000,
    monthlyRevenue: 8500,
    systemHealth: 'healthy',
    recentActivity: [
      {
        type: 'user_signup',
        message: 'New user registered',
        timestamp: new Date().toISOString()
      },
      {
        type: 'resume_processed',
        message: 'Resume processed successfully',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Basic users endpoint
app.get('/api/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  
  // Mock user data
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

// Basic resumes endpoint
app.get('/api/resumes', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Mock resume data
  const resumes = [
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      fileName: 'john_doe_resume.pdf',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    resumes: resumes,
    pagination: {
      page: page,
      limit: limit,
      total: resumes.length,
      totalPages: Math.ceil(resumes.length / limit)
    }
  });
});

// Basic jobs endpoint
app.get('/api/jobs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Mock job data
  const jobs = [
    {
      id: 'job_001',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      remote: true,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    jobs: jobs,
    pagination: {
      page: page,
      limit: limit,
      total: jobs.length,
      totalPages: Math.ceil(jobs.length / limit)
    }
  });
});

// Basic skills analytics endpoint
app.get('/api/skills/analytics', (req, res) => {
  res.json({
    totalSkills: 150,
    popularSkills: [
      { name: 'JavaScript', count: 45 },
      { name: 'Python', count: 38 },
      { name: 'React', count: 32 }
    ],
    skillGaps: [
      { skill: 'Machine Learning', gap: 15 },
      { skill: 'DevOps', gap: 12 }
    ]
  });
});

// Basic system health endpoint
app.get('/api/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: { status: 'connected' },
    redis: { status: 'connected' },
    jobQueues: { status: 'running' },
    externalServices: { status: 'available' },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Upstar Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/api/dashboard/overview`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📄 Resumes: http://localhost:${PORT}/api/resumes`);
  console.log(`💼 Jobs: http://localhost:${PORT}/api/jobs`);
  console.log(`🎯 Skills: http://localhost:${PORT}/api/skills/analytics`);
  console.log(`🏥 System: http://localhost:${PORT}/api/system/health`);
});

module.exports = app;

