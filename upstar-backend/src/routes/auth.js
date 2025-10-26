const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to verify
 *     responses:
 *       200:
 *         description: Token verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/verify', [
  body('token').isString().withMessage('Token is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { token } = req.body;
  const jwt = require('jsonwebtoken');

  try {
    // Check if it's a mock token (frontend-generated)
    if (token.includes('mock-signature')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        // Check if token is expired
        if (payload.exp && Date.now() > payload.exp) {
          throw new UnauthorizedError('Token expired');
        }

        res.json({
          valid: true,
          user: {
            id: payload.userId,
            email: payload.email,
            name: payload.name || 'User',
            roles: [payload.role]
          }
        });
        return;
      }
    }

    // Verify JWT token (Auth0 style)
    const decoded = jwt.verify(token, process.env.AUTH0_CLIENT_SECRET || 'temp-secret');
    
    // Get user from database
    const userResult = await query(
      'SELECT id, email, name, roles, active FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = userResult.rows[0];

    if (!user.active) {
      throw new UnauthorizedError('User account is inactive');
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired token');
    }
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refresh', [
  body('refreshToken').isString().withMessage('Refresh token is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { refreshToken } = req.body;
  const jwt = require('jsonwebtoken');

  try {
    // Check if it's a mock refresh token
    if (refreshToken.includes('mock-signature')) {
      const parts = refreshToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        // Check if token is expired
        if (payload.exp && Date.now() > payload.exp) {
          throw new UnauthorizedError('Refresh token expired');
        }

        // Generate new mock access token
        const newAccessToken = jwt.sign(
          {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
          },
          'mock-secret',
          { algorithm: 'HS256' }
        );

        res.json({
          accessToken: newAccessToken,
          expiresIn: 86400 // 24 hours in seconds
        });
        return;
      }
    }

    // Verify refresh token (Auth0 style)
    const decoded = jwt.verify(refreshToken, process.env.AUTH0_CLIENT_SECRET || 'temp-secret');
    
    // Check if user exists and is active
    const userResult = await query(
      'SELECT id, email, name, roles, active FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = userResult.rows[0];

    if (!user.active) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        'https://upstar.com/permissions': ['users:read', 'resumes:read', 'analytics:read'],
        aud: process.env.AUTH0_AUDIENCE,
        iss: `https://${process.env.AUTH0_DOMAIN}/`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.AUTH0_CLIENT_SECRET || 'temp-secret',
      { algorithm: 'HS256' }
    );

    res.json({
      accessToken,
      expiresIn: 3600 // 1 hour in seconds
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // In a real implementation, you would:
  // 1. Add the token to a blacklist
  // 2. Clear any server-side sessions
  // 3. Log the logout event
  
  // For now, we'll just return a success message
  res.json({
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 lastLogin:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/profile', asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const { id } = req.user;

  // Get user profile from database
  const userResult = await query(
    'SELECT id, email, name, roles, last_login_at FROM users WHERE id = $1',
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  const user = userResult.rows[0];

  // Map roles to permissions
  const rolePermissions = {
    admin: ['users:read', 'users:write', 'resumes:read', 'resumes:write', 'analytics:read', 'notifications:write', 'cms:write', 'ai:read', 'ai:write', 'system:read', 'system:write', 'payments:read', 'jobs:read', 'jobs:write'],
    moderator: ['users:read', 'resumes:read', 'analytics:read', 'notifications:write', 'cms:read', 'cms:write'],
    user: ['users:read', 'resumes:read', 'analytics:read']
  };

  const permissions = [];
  user.roles.forEach(role => {
    if (rolePermissions[role]) {
      permissions.push(...rolePermissions[role]);
    }
  });

  // Remove duplicates
  const uniquePermissions = [...new Set(permissions)];

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    permissions: uniquePermissions,
    lastLogin: user.last_login_at
  });
}));

/**
 * @swagger
 * /api/auth/check-permission:
 *   post:
 *     summary: Check if user has specific permission
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *                 description: Permission to check
 *     responses:
 *       200:
 *         description: Permission check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasPermission:
 *                   type: boolean
 *                 permission:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/check-permission', [
  body('permission').isString().withMessage('Permission is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const { permission } = req.body;
  const { roles } = req.user;

  // Map roles to permissions
  const rolePermissions = {
    admin: ['users:read', 'users:write', 'resumes:read', 'resumes:write', 'analytics:read', 'notifications:write', 'cms:write', 'ai:read', 'ai:write', 'system:read', 'system:write', 'payments:read', 'jobs:read', 'jobs:write'],
    moderator: ['users:read', 'resumes:read', 'analytics:read', 'notifications:write', 'cms:read', 'cms:write'],
    user: ['users:read', 'resumes:read', 'analytics:read']
  };

  const userPermissions = [];
  roles.forEach(role => {
    if (rolePermissions[role]) {
      userPermissions.push(...rolePermissions[role]);
    }
  });

  const hasPermission = userPermissions.includes(permission);

  res.json({
    hasPermission,
    permission
  });
}));

module.exports = router;