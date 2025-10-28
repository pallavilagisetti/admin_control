const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'upstar-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, code: 'NOT_FOUND', statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, code: 'DUPLICATE_ENTRY', statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, code: 'VALIDATION_ERROR', statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, code: 'INVALID_TOKEN', statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, code: 'TOKEN_EXPIRED', statusCode: 401 };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    const message = 'Duplicate entry';
    error = { message, code: 'DUPLICATE_ENTRY', statusCode: 400 };
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced record not found';
    error = { message, code: 'FOREIGN_KEY_VIOLATION', statusCode: 400 };
  }

  if (err.code === '23502') { // Not null violation
    const message = 'Required field missing';
    error = { message, code: 'REQUIRED_FIELD_MISSING', statusCode: 400 };
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = 'Too many requests';
    error = { message, code: 'RATE_LIMITED', statusCode: 429 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, code: 'FILE_TOO_LARGE', statusCode: 413 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, code: 'INVALID_FILE_FIELD', statusCode: 400 };
  }

  // AWS S3 errors
  if (err.code === 'NoSuchBucket') {
    const message = 'Storage bucket not found';
    error = { message, code: 'STORAGE_ERROR', statusCode: 500 };
  }

  if (err.code === 'AccessDenied') {
    const message = 'Storage access denied';
    error = { message, code: 'STORAGE_ACCESS_DENIED', statusCode: 403 };
  }

  // OpenAI API errors
  if (err.code === 'insufficient_quota') {
    const message = 'AI service quota exceeded';
    error = { message, code: 'AI_QUOTA_EXCEEDED', statusCode: 429 };
  }

  if (err.code === 'rate_limit_exceeded') {
    const message = 'AI service rate limit exceeded';
    error = { message, code: 'AI_RATE_LIMIT_EXCEEDED', statusCode: 429 };
  }

  // Redis connection errors
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    const message = 'Cache service unavailable';
    error = { message, code: 'CACHE_UNAVAILABLE', statusCode: 503 };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect' && err.port === 5433) {
    const message = 'Database service unavailable';
    error = { message, code: 'DATABASE_UNAVAILABLE', statusCode: 503 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'SERVER_ERROR';

  // Don't leak error details in production
  const response = {
    error: message,
    code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(statusCode).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMITED');
  }
}

// Error response helper
const sendErrorResponse = (res, statusCode, message, code, details = {}) => {
  res.status(statusCode).json({
    error: message,
    code,
    ...details
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  sendErrorResponse,
  logger
};