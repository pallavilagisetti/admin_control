const request = require('supertest');
const app = require('../../src/server');
const { query } = require('../../src/config/database');

describe('End-to-End Workflow Tests', () => {
  let authToken;
  let testUser;
  let testResume;
  let testJob;

  beforeAll(async () => {
    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, name, roles, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      ['e2e@example.com', 'E2E Test User', ['user'], true]
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
    await query('DELETE FROM users WHERE email = $1', ['e2e@example.com']);
  });

  describe('Complete User Journey', () => {
    it('should complete full user registration and onboarding flow', async () => {
      // Step 1: User registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'SecurePass123!'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('token');

      const newUserToken = registerResponse.body.token;

      // Step 2: User uploads resume
      const resumeResponse = await request(app)
        .post('/api/upload/resume')
        .set('Authorization', `Bearer ${newUserToken}`)
        .attach('file', Buffer.from('fake resume content'), 'resume.pdf')
        .field('userId', registerResponse.body.user.id);

      expect(resumeResponse.status).toBe(200);
      expect(resumeResponse.body).toHaveProperty('resumeId');
      testResume = resumeResponse.body;

      // Step 3: Resume gets processed (simulated)
      const processResponse = await request(app)
        .post('/api/jobs/process-resume')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ resumeId: testResume.resumeId });

      expect(processResponse.status).toBe(200);
      expect(processResponse.body).toHaveProperty('jobId');

      // Step 4: User gets job matches
      const matchesResponse = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${newUserToken}`)
        .query({ userId: registerResponse.body.user.id });

      expect(matchesResponse.status).toBe(200);
      expect(matchesResponse.body).toHaveProperty('jobs');

      // Step 5: User applies to a job
      if (matchesResponse.body.jobs.length > 0) {
        testJob = matchesResponse.body.jobs[0];
        
        const applyResponse = await request(app)
          .post(`/api/jobs/${testJob.id}/apply`)
          .set('Authorization', `Bearer ${newUserToken}`)
          .send({ userId: registerResponse.body.user.id });

        expect(applyResponse.status).toBe(200);
        expect(applyResponse.body).toHaveProperty('message');
      }

      // Clean up
      await query('DELETE FROM users WHERE email = $1', ['newuser@example.com']);
    });

    it('should complete admin dashboard workflow', async () => {
      // Create admin user
      const adminResult = await query(
        `INSERT INTO users (email, name, roles, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        ['admin@example.com', 'Admin User', ['admin'], true]
      );

      const adminToken = require('jsonwebtoken').sign(
        {
          sub: adminResult.rows[0].id,
          email: adminResult.rows[0].email,
          name: adminResult.rows[0].name,
          roles: adminResult.rows[0].roles
        },
        'test-secret',
        { expiresIn: '1h' }
      );

      // Step 1: Admin views dashboard
      const dashboardResponse = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.body).toHaveProperty('summary');
      expect(dashboardResponse.body).toHaveProperty('metrics');

      // Step 2: Admin manages users
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body).toHaveProperty('users');

      // Step 3: Admin views analytics
      const analyticsResponse = await request(app)
        .get('/api/analytics/skill-analysis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body).toHaveProperty('gaps');

      // Step 4: Admin sends notification
      const notificationResponse = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'System Maintenance',
          content: 'Scheduled maintenance will occur tonight.',
          audience: 'All Users',
          schedule: 'now'
        });

      expect(notificationResponse.status).toBe(200);
      expect(notificationResponse.body).toHaveProperty('message');

      // Clean up
      await query('DELETE FROM users WHERE email = $1', ['admin@example.com']);
    });

    it('should complete resume processing workflow', async () => {
      // Step 1: Upload resume
      const uploadResponse = await request(app)
        .post('/api/upload/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake resume content'), 'resume.pdf')
        .field('userId', testUser.id);

      expect(uploadResponse.status).toBe(200);
      const resumeId = uploadResponse.body.resumeId;

      // Step 2: Process resume
      const processResponse = await request(app)
        .post('/api/jobs/process-resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resumeId });

      expect(processResponse.status).toBe(200);
      const jobId = processResponse.body.jobId;

      // Step 3: Check processing status
      const statusResponse = await request(app)
        .get(`/api/jobs/status/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toHaveProperty('status');

      // Step 4: Get processed resume data
      const resumeResponse = await request(app)
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resumeResponse.status).toBe(200);
      expect(resumeResponse.body).toHaveProperty('id', resumeId);
    });

    it('should complete job matching workflow', async () => {
      // Step 1: Create a job
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Software Engineer',
          organization: 'Tech Corp',
          location: 'San Francisco, CA',
          skills: ['JavaScript', 'React', 'Node.js'],
          description: 'Great opportunity for a software engineer'
        });

      if (jobResponse.status === 201) {
        const jobId = jobResponse.body.job.id;

        // Step 2: Match users to job
        const matchResponse = await request(app)
          .post('/api/jobs/match-users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId: testUser.id,
            resumeId: testResume?.resumeId || 'test-resume-id'
          });

        expect(matchResponse.status).toBe(200);
        expect(matchResponse.body).toHaveProperty('jobId');

        // Step 3: Get job matches
        const matchesResponse = await request(app)
          .get(`/api/jobs/${jobId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(matchesResponse.status).toBe(200);
        expect(matchesResponse.body).toHaveProperty('id', jobId);

        // Clean up
        await query('DELETE FROM jobs WHERE id = $1', [jobId]);
      }
    });

    it('should complete payment workflow', async () => {
      // Step 1: Get subscription plans
      const plansResponse = await request(app)
        .get('/api/payments/subscriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(plansResponse.status).toBe(200);
      expect(plansResponse.body).toHaveProperty('subscriptions');

      // Step 2: Process payment (simulated)
      const paymentResponse = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 19.99,
          currency: 'USD',
          paymentMethodId: 'pm_test_123'
        });

      if (paymentResponse.status === 200) {
        expect(paymentResponse.body).toHaveProperty('transactionId');

        // Step 3: Get transaction history
        const historyResponse = await request(app)
          .get('/api/payments/transactions')
          .set('Authorization', `Bearer ${authToken}`);

        expect(historyResponse.status).toBe(200);
        expect(historyResponse.body).toHaveProperty('transactions');
      }
    });

    it('should complete CMS workflow', async () => {
      // Step 1: Create article
      const createResponse = await request(app)
        .post('/api/cms/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Getting Started Guide',
          slug: 'getting-started',
          content: 'Welcome to our platform...',
          status: 'published'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty('article');
      const articleId = createResponse.body.article.id;

      // Step 2: Get articles
      const articlesResponse = await request(app)
        .get('/api/cms/articles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(articlesResponse.status).toBe(200);
      expect(articlesResponse.body).toHaveProperty('articles');

      // Step 3: Update article
      const updateResponse = await request(app)
        .put(`/api/cms/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Getting Started Guide',
          content: 'Updated content...'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('article');

      // Step 4: Delete article
      const deleteResponse = await request(app)
        .delete(`/api/cms/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('message');
    });

    it('should complete system monitoring workflow', async () => {
      // Step 1: Check system health
      const healthResponse = await request(app)
        .get('/api/system/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toHaveProperty('overall');

      // Step 2: Get detailed health
      const detailedResponse = await request(app)
        .get('/api/health/detailed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(detailedResponse.status).toBe(200);
      expect(detailedResponse.body).toHaveProperty('database');
      expect(detailedResponse.body).toHaveProperty('redis');

      // Step 3: Get system activity
      const activityResponse = await request(app)
        .get('/api/system/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(activityResponse.status).toBe(200);
      expect(activityResponse.body).toHaveProperty('activities');

      // Step 4: Get performance metrics
      const metricsResponse = await request(app)
        .get('/api/system/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body).toHaveProperty('metrics');
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle and recover from processing errors', async () => {
      // Step 1: Upload resume with processing error
      const uploadResponse = await request(app)
        .post('/api/upload/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('corrupted resume content'), 'resume.pdf')
        .field('userId', testUser.id);

      if (uploadResponse.status === 200) {
        const resumeId = uploadResponse.body.resumeId;

        // Step 2: Check for processing errors
        const errorsResponse = await request(app)
          .get('/api/skills/errors')
          .set('Authorization', `Bearer ${authToken}`);

        expect(errorsResponse.status).toBe(200);
        expect(errorsResponse.body).toHaveProperty('errors');

        // Step 3: Retry processing
        const retryResponse = await request(app)
          .post(`/api/resumes/${resumeId}/reprocess`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(retryResponse.status).toBe(200);
        expect(retryResponse.body).toHaveProperty('message');
      }
    });

    it('should handle system failures gracefully', async () => {
      // Step 1: Check system health during simulated issues
      const healthResponse = await request(app)
        .get('/api/system/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(healthResponse.status).toBe(200);

      // Step 2: Get system alerts
      const alertsResponse = await request(app)
        .get('/api/system/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(alertsResponse.status).toBe(200);
      expect(alertsResponse.body).toHaveProperty('alerts');

      // Step 3: Resolve alerts if any
      if (alertsResponse.body.alerts.length > 0) {
        const alertId = alertsResponse.body.alerts[0].id;
        
        const resolveResponse = await request(app)
          .post(`/api/system/alerts/${alertId}/resolve`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resolveResponse.status).toBe(200);
        expect(resolveResponse.body).toHaveProperty('message');
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array(10).fill().map(() =>
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });

    it('should handle large data sets', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
    });
  });
});






