const request = require('supertest');
const app = require('../../src/server');
const { query } = require('../../src/config/database');

describe('User API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, name, roles, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      ['test@example.com', 'Test User', ['user'], true]
    );
    testUser = userResult.rows[0];

    // Generate auth token (simplified for testing)
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      {
        sub: testUser.id,
        email: testUser.email,
        name: testUser.name,
        roles: testUser.roles
      },
      'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM users WHERE email = $1', ['test@example.com']);
  });

  describe('GET /api/users', () => {
    it('should return users list with pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should filter users by search term', async () => {
      const response = await request(app)
        .get('/api/users?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].name).toContain('Test');
    });

    it('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/users?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.users.every(user => user.active === true)).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.users.every(user => user.roles.includes('user'))).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return specific user details', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('profile');
      expect(response.body).toHaveProperty('resumes');
      expect(response.body).toHaveProperty('matchedJobs');
      expect(response.body).toHaveProperty('assessments');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('PATCH /api/users', () => {
    it('should update user information', async () => {
      const updateData = {
        id: testUser.id,
        roles: ['user', 'moderator'],
        active: true
      };

      const response = await request(app)
        .patch('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.roles).toEqual(['user', 'moderator']);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        id: testUser.id,
        roles: 'invalid' // Should be array
      };

      const response = await request(app)
        .patch('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440999';
      const updateData = {
        id: fakeId,
        roles: ['admin']
      };

      const response = await request(app)
        .patch('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('POST /api/users/:id/login-as', () => {
    it('should generate login token for admin', async () => {
      // Create admin user for this test
      const adminResult = await query(
        `INSERT INTO users (email, name, roles, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        ['admin@example.com', 'Admin User', ['admin'], true]
      );
      const adminUser = adminResult.rows[0];

      const adminToken = require('jsonwebtoken').sign(
        {
          sub: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          roles: adminUser.roles
        },
        'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`/api/users/${testUser.id}/login-as`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('loginToken');
      expect(response.body).toHaveProperty('expiresAt');
      expect(typeof response.body.loginToken).toBe('string');
      expect(typeof response.body.expiresAt).toBe('string');

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [adminUser.id]);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post(`/api/users/${testUser.id}/login-as`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });
});






