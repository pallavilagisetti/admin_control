const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa'); // ✅ Correct library

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

// JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Get signing key
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Development mode - bypass authentication if no Auth0 configured OR if using mock tokens
    if (process.env.NODE_ENV === 'development' && (!AUTH0_DOMAIN || AUTH0_DOMAIN === 'your-domain.auth0.com')) {
      // Mock user for development
      req.user = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        roles: ['admin'],
        permissions: [
          'users:read', 'users:write', 'users:delete',
          'resumes:read', 'resumes:write', 'resumes:delete',
          'jobs:read', 'jobs:write', 'jobs:delete',
          'analytics:read', 'analytics:write',
          'payments:read', 'payments:write',
          'ai:read', 'ai:write',
          'system:read', 'system:write',
          'notifications:read', 'notifications:write',
          'cms:read', 'cms:write',
          'files:write'
        ]
      };
      return next();
    }

    // Also bypass authentication if no token is provided in development mode
    const authHeader = req.headers.authorization;
    if (!authHeader && process.env.NODE_ENV === 'development') {
      req.user = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        roles: ['admin'],
        permissions: [
          'users:read', 'users:write', 'users:delete',
          'resumes:read', 'resumes:write', 'resumes:delete',
          'jobs:read', 'jobs:write', 'jobs:delete',
          'analytics:read', 'analytics:write',
          'payments:read', 'payments:write',
          'ai:read', 'ai:write',
          'system:read', 'system:write',
          'notifications:read', 'notifications:write',
          'cms:read', 'cms:write',
          'files:write'
        ]
      };
      return next();
    }
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check if it's a mock token (frontend-generated)
    if (token && token.includes('mock-signature')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          // Check if token is expired
          if (payload.exp && Date.now() > payload.exp) {
            return res.status(401).json({
              error: 'Token expired',
              code: 'UNAUTHORIZED'
            });
          }
          
          // Mock user based on token payload
          req.user = {
            id: payload.userId || 'dev-user-123',
            email: payload.email || 'dev@example.com',
            name: payload.name || 'Development User',
            roles: [payload.role || 'admin'],
            permissions: [
          'users:read', 'users:write', 'users:delete',
          'resumes:read', 'resumes:write', 'resumes:delete',
          'jobs:read', 'jobs:write', 'jobs:delete',
          'analytics:read', 'analytics:write',
          'payments:read', 'payments:write',
          'ai:read', 'ai:write',
          'system:read', 'system:write',
          'notifications:read', 'notifications:write',
          'cms:read', 'cms:write',
          'files:write'
        ]
          };
          return next();
        }
      } catch (error) {
        console.log('Mock token parsing failed, falling back to Auth0 verification');
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify JWT token
    jwt.verify(
      token,
      getKey,
      {
        audience: AUTH0_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err);
          return res.status(403).json({
            error: 'Invalid or expired token',
            code: 'FORBIDDEN'
          });
        }

        // Add user info to request
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          roles: decoded['https://upstar.com/roles'] || ['user'],
          permissions: decoded['https://upstar.com/permissions'] || []
        };

        next();
      }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication service error',
      code: 'SERVER_ERROR'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: roles,
        current: userRoles
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasRequiredPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permissions,
        current: userPermissions
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin']);

// Moderator or Admin middleware
const requireModerator = requireRole(['admin', 'moderator']);

// User can access their own data or admin can access any data
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  const userId = req.params.id || req.params.userId;
  const isAdmin = req.user.roles.includes('admin');
  const isOwnData = req.user.id === userId;

  if (!isAdmin && !isOwnData) {
    return res.status(403).json({
      error: 'Access denied. You can only access your own data.',
      code: 'FORBIDDEN'
    });
  }

  next();
};

// Rate limiting for specific endpoints
const createRateLimit = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limits
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  'Too many authentication attempts, please try again later.'
);

const dataModificationRateLimit = createRateLimit(
  15 * 60 * 1000,
  20,
  'Too many data modification requests, please try again later.'
);

const aiProcessingRateLimit = createRateLimit(
  15 * 60 * 1000,
  10,
  'Too many AI processing requests, please try again later.'
);

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireAdmin,
  requireModerator,
  requireOwnershipOrAdmin,
  authRateLimit,
  dataModificationRateLimit,
  aiProcessingRateLimit
};
