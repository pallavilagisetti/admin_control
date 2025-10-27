const { query, cache } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

class UserController {
  // Get all users with filtering and pagination
  static async getUsers(req, res) {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      role
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (search) {
      paramCount++;
      whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`u.active = $${paramCount}`);
      queryParams.push(status === 'active');
    }

    if (role) {
      paramCount++;
      whereConditions.push(`u.roles @> $${paramCount}`);
      queryParams.push(`["${role}"]`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get users with pagination
    const usersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.active,
        u.roles,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        COUNT(r.id) as resume_count,
        COUNT(j.id) as job_matches
      FROM users u
      LEFT JOIN resumes r ON u.id = r.user_id
      LEFT JOIN user_job_matches j ON u.id = j.user_id
      ${whereClause}
      GROUP BY u.id, u.name, u.email, u.active, u.roles, u.created_at, u.updated_at, u.last_login_at
      ORDER BY u.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(parseInt(limit), offset);
    const usersResult = await query(usersQuery, queryParams);

    const users = usersResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
      roles: user.roles,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
      resumeCount: parseInt(user.resume_count),
      jobMatches: parseInt(user.job_matches)
    }));

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }

  // Update user information
  static async updateUser(req, res) {
    const { id, roles, active } = req.body;

    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      throw new NotFoundError('User');
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (roles !== undefined) {
      paramCount++;
      updateFields.push(`roles = $${paramCount}`);
      updateValues.push(roles);
    }

    if (active !== undefined) {
      paramCount++;
      updateFields.push(`active = $${paramCount}`);
      updateValues.push(active);
    }

    if (updateFields.length === 0) {
      throw new ValidationError('No fields to update');
    }

    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, active, roles, updated_at
    `;

    const result = await query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    // Clear cache
    await cache.del(`user:${id}`);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        active: updatedUser.active,
        roles: updatedUser.roles,
        updatedAt: updatedUser.updated_at
      }
    });
  }

  // Get specific user details
  static async getUserById(req, res) {
    const { id } = req.params;

    // Try cache first
    const cacheKey = `user:${id}`;
    let userData = await cache.get(cacheKey);

    if (!userData) {
      const userQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.active,
          u.roles,
          u.created_at,
          u.last_login_at,
          u.tier,
          COUNT(DISTINCT r.id) as resume_count,
          COUNT(DISTINCT jm.job_id) as matched_jobs,
          COUNT(DISTINCT a.id) as assessment_count
        FROM users u
        LEFT JOIN resumes r ON u.id = r.user_id
        LEFT JOIN user_job_matches jm ON u.id = jm.user_id
        LEFT JOIN assessments a ON u.id = a.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email, u.active, u.roles, u.created_at, u.last_login_at, u.tier
      `;

      const result = await query(userQuery, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('User');
      }

      const user = result.rows[0];
      userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
        roles: user.roles,
        profile: {
          tier: user.tier || 'free',
          createdAt: user.created_at,
          lastLogin: user.last_login_at
        },
        resumes: parseInt(user.resume_count),
        matchedJobs: parseInt(user.matched_jobs),
        assessments: parseInt(user.assessment_count)
      };

      // Cache for 5 minutes
      await cache.set(cacheKey, userData, 300);
    }

    res.json(userData);
  }

  // Generate login token for admin to login as user
  static async loginAsUser(req, res) {
    const { id } = req.params;
    const jwt = require('jsonwebtoken');

    // Check if user exists
    const userResult = await query('SELECT id, name, email, roles FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = userResult.rows[0];

    // Generate temporary login token
    const loginToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        'https://upstar.com/permissions': ['users:read', 'users:write', 'resumes:read', 'analytics:read'],
        aud: process.env.AUTH0_AUDIENCE,
        iss: `https://${process.env.AUTH0_DOMAIN}/`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.AUTH0_CLIENT_SECRET || 'temp-secret',
      { algorithm: 'HS256' }
    );

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    res.json({
      loginToken,
      expiresAt: expiresAt.toISOString()
    });
  }
}

module.exports = UserController;






