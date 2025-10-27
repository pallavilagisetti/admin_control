const { query, cache } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.roles = data.roles || ['user'];
    this.active = data.active !== undefined ? data.active : true;
    this.tier = data.tier || 'free';
    this.country = data.country;
    this.lastLoginAt = data.last_login_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const { email, name, roles = ['user'], tier = 'free', country } = userData;
    
    const result = await query(
      `INSERT INTO users (email, name, roles, tier, country, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [email, name, roles, tier, country]
    );

    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const cacheKey = `user:${id}`;
    let userData = await cache.get(cacheKey);

    if (!userData) {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      userData = result.rows[0];
      await cache.set(cacheKey, userData, 300); // Cache for 5 minutes
    }

    return new User(userData);
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Update user
  async update(updateData) {
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return this;
    }

    paramCount++;
    updateFields.push('updated_at = NOW()');
    updateValues.push(this.id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    // Update instance properties
    Object.assign(this, updatedUser);

    // Clear cache
    await cache.del(`user:${this.id}`);

    return this;
  }

  // Delete user
  async delete() {
    await query('DELETE FROM users WHERE id = $1', [this.id]);
    await cache.del(`user:${this.id}`);
  }

  // Get user statistics
  async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT r.id) as resume_count,
        COUNT(DISTINCT jm.job_id) as matched_jobs,
        COUNT(DISTINCT a.id) as assessment_count
      FROM users u
      LEFT JOIN resumes r ON u.id = r.user_id
      LEFT JOIN user_job_matches jm ON u.id = jm.user_id
      LEFT JOIN assessments a ON u.id = a.user_id
      WHERE u.id = $1
    `;

    const result = await query(statsQuery, [this.id]);
    return result.rows[0];
  }

  // Check if user has permission
  hasPermission(permission) {
    const rolePermissions = {
      admin: ['users:read', 'users:write', 'resumes:read', 'resumes:write', 'analytics:read', 'notifications:write', 'cms:write', 'ai:read', 'ai:write', 'system:read', 'system:write', 'payments:read', 'jobs:read', 'jobs:write'],
      moderator: ['users:read', 'resumes:read', 'analytics:read', 'notifications:write', 'cms:read', 'cms:write'],
      user: ['users:read', 'resumes:read', 'analytics:read']
    };

    const userPermissions = [];
    this.roles.forEach(role => {
      if (rolePermissions[role]) {
        userPermissions.push(...rolePermissions[role]);
      }
    });

    return userPermissions.includes(permission);
  }

  // Get user permissions
  getPermissions() {
    const rolePermissions = {
      admin: ['users:read', 'users:write', 'resumes:read', 'resumes:write', 'analytics:read', 'notifications:write', 'cms:write', 'ai:read', 'ai:write', 'system:read', 'system:write', 'payments:read', 'jobs:read', 'jobs:write'],
      moderator: ['users:read', 'resumes:read', 'analytics:read', 'notifications:write', 'cms:read', 'cms:write'],
      user: ['users:read', 'resumes:read', 'analytics:read']
    };

    const permissions = [];
    this.roles.forEach(role => {
      if (rolePermissions[role]) {
        permissions.push(...rolePermissions[role]);
      }
    });

    return [...new Set(permissions)]; // Remove duplicates
  }

  // Update last login
  async updateLastLogin() {
    await query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [this.id]
    );
    this.lastLoginAt = new Date();
    await cache.del(`user:${this.id}`);
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      roles: this.roles,
      active: this.active,
      subscriptionTier: this.subscriptionTier,
      country: this.country,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;






