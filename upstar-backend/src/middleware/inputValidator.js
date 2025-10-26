const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Input validation middleware
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    
    next();
  };
};

// Common validation rules
const commonValidations = {
  // UUID validation
  uuid: (field) => param(field).isUUID().withMessage('Invalid UUID format'),
  
  // Email validation
  email: (field) => body(field).isEmail().normalizeEmail().withMessage('Invalid email format'),
  
  // Password validation
  password: (field) => body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  // Name validation
  name: (field) => body(field)
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  // Phone validation
  phone: (field) => body(field)
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  
  // URL validation
  url: (field) => body(field)
    .optional()
    .isURL()
    .withMessage('Invalid URL format'),
  
  // Pagination validation
  pagination: () => [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  
  // Date validation
  date: (field) => body(field)
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  // Boolean validation
  boolean: (field) => body(field)
    .optional()
    .isBoolean()
    .withMessage('Must be a boolean value'),
  
  // Array validation
  array: (field) => body(field)
    .optional()
    .isArray()
    .withMessage('Must be an array'),
  
  // String length validation
  stringLength: (field, min = 1, max = 255) => body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`Must be between ${min} and ${max} characters`),
  
  // Numeric validation
  numeric: (field, min = 0, max = Number.MAX_SAFE_INTEGER) => body(field)
    .optional()
    .isNumeric()
    .withMessage('Must be a number')
    .isFloat({ min, max })
    .withMessage(`Must be between ${min} and ${max}`)
};

// Specific validation rules for different endpoints
const endpointValidations = {
  // User management
  createUser: [
    commonValidations.email('email'),
    commonValidations.name('name'),
    body('roles').optional().isArray().withMessage('Roles must be an array'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean')
  ],
  
  updateUser: [
    body('id').isUUID().withMessage('Valid user ID required'),
    body('roles').optional().isArray().withMessage('Roles must be an array'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean')
  ],
  
  // Resume management
  uploadResume: [
    body('userId').optional().isUUID().withMessage('Valid user ID required'),
    // File validation is handled by multer middleware
  ],
  
  // Job management
  createJob: [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
    body('organization').optional().trim().isLength({ max: 255 }).withMessage('Organization name too long'),
    body('location').optional().trim().isLength({ max: 255 }).withMessage('Location too long'),
    body('employmentType').optional().isArray().withMessage('Employment type must be an array'),
    body('remote').optional().isBoolean().withMessage('Remote must be a boolean'),
    body('salaryMin').optional().isInt({ min: 0 }).withMessage('Minimum salary must be a positive integer'),
    body('salaryMax').optional().isInt({ min: 0 }).withMessage('Maximum salary must be a positive integer'),
    body('skills').optional().isArray().withMessage('Skills must be an array')
  ],
  
  // Payment management
  processPayment: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('paymentMethodId').isLength({ min: 1 }).withMessage('Payment method ID is required')
  ],
  
  // Notification management
  sendNotification: [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content is required'),
    body('audience').isIn(['All Users', 'Premium Users', 'Free Users', 'Specific Users']).withMessage('Invalid audience type'),
    body('schedule').optional().isISO8601().withMessage('Invalid schedule format')
  ],
  
  // CMS management
  createArticle: [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
    body('slug').trim().isLength({ min: 1, max: 255 }).withMessage('Slug is required'),
    body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
  ],
  
  updateArticle: [
    param('id').isUUID().withMessage('Valid article ID required'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title too long'),
    body('content').optional().trim().isLength({ min: 1 }).withMessage('Content is required'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
  ],
  
  // AI Settings
  updateAISettings: [
    body('settings').isArray().withMessage('Settings must be an array'),
    body('settings.*.id').isLength({ min: 1 }).withMessage('Setting ID is required'),
    body('settings.*.value').notEmpty().withMessage('Setting value is required')
  ],
  
  // Search and filtering
  searchUsers: [
    ...commonValidations.pagination(),
    query('search').optional().trim().isLength({ max: 255 }).withMessage('Search term too long'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status filter'),
    query('role').optional().isIn(['admin', 'moderator', 'user']).withMessage('Invalid role filter')
  ],
  
  searchJobs: [
    ...commonValidations.pagination(),
    query('search').optional().trim().isLength({ max: 255 }).withMessage('Search term too long'),
    query('location').optional().trim().isLength({ max: 255 }).withMessage('Location too long'),
    query('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']).withMessage('Invalid employment type'),
    query('remote').optional().isBoolean().withMessage('Remote must be a boolean')
  ]
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&<>"']/g, (match) => {
        const escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[match];
      });
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Rate limiting validation
const validateRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    next();
  };
};

module.exports = {
  validateInput,
  commonValidations,
  endpointValidations,
  sanitizeInput,
  validateRateLimit
};





