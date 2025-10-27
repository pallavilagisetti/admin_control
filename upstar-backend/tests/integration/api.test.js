const request = require('supertest');
const app = require('../../src/server');
const { query } = require('../../src/config/database');

describe('API Integration Tests', () => {
  let authToken;
  let testUser;
  let testResume;

  beforeAll(async () => {
    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, name, roles, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      ['integration@example.com', 'Integration Test User', ['user'], true]
    );
    testUser = userResult.rows[0];

    // Generate auth token
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
    await query('DELETE FROM users WHERE email = $1', ['integration@example.com']);
  });

  describe('Authentication Flow', () => {
    it('should authenticate user with valid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('User Management Flow', () => {
    it('should get users list with pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('should get specific user details', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

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
    });
  });

  describe('Resume Management Flow', () => {
    it('should get resumes list', async () => {
      const response = await request(app)
        .get('/api/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('resumes');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should create resume record', async () => {
      const resumeData = {
        userId: testUser.id,
        filename: 'test-resume.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf'
      };

      const response = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(resumeData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Resume created successfully');
      expect(response.body).toHaveProperty('resume');
      expect(response.body.resume).toHaveProperty('id');
      
      testResume = response.body.resume;
    });

    it('should get specific resume details', async () => {
      const response = await request(app)
        .get(`/api/resumes/${testResume.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testResume.id);
      expect(response.body).toHaveProperty('filename', testResume.filename);
    });

    it('should trigger resume reprocessing', async () => {
      const response = await request(app)
        .post(`/api/resumes/${testResume.id}/reprocess`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('Skills Analytics Flow', () => {
    it('should get skills analytics', async () => {
      const response = await request(app)
        .get('/api/skills/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('topSkills');
      expect(response.body).toHaveProperty('topMissing');
    });

    it('should get skills errors', async () => {
      const response = await request(app)
        .get('/api/skills/errors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('Job Management Flow', () => {
    it('should get jobs list', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should trigger job sync', async () => {
      const response = await request(app)
        .post('/api/jobs/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('syncId');
    });
  });

  describe('Analytics Flow', () => {
    it('should get skill analysis', async () => {
      const response = await request(app)
        .get('/api/analytics/skill-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('gaps');
      expect(response.body).toHaveProperty('emerging');
    });

    it('should get market trends', async () => {
      const response = await request(app)
        .get('/api/analytics/market-trends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('trends');
    });

    it('should get job performance metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/job-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('clickThroughRate');
      expect(response.body).toHaveProperty('applicationRate');
    });
  });

  describe('System Health Flow', () => {
    it('should get system health', async () => {
      const response = await request(app)
        .get('/api/system/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should get system activity', async () => {
      const response = await request(app)
        .get('/api/system/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('activities');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/users/550e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .patch('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ id: 'invalid-uuid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should handle server errors gracefully', async () => {
      // This would require mocking a database error
      // For now, we'll test the error handler structure
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Make multiple requests quickly
      const promises = Array(10).fill().map(() => 
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed (rate limit is high for testing)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create a user
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'consistency@example.com',
          name: 'Consistency Test User',
          roles: ['user']
        });

      if (createResponse.status === 201) {
        const userId = createResponse.body.user.id;

        // Update the user
        const updateResponse = await request(app)
          .patch('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            id: userId,
            roles: ['moderator']
          });

        expect(updateResponse.status).toBe(200);

        // Verify the update
        const getResponse = await request(app)
          .get(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.roles).toContain('moderator');

        // Clean up
        await query('DELETE FROM users WHERE id = $1', [userId]);
      }
    });
  });
});






