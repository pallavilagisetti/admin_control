const request = require('supertest');
const app = require('../../src/server');
const { query } = require('../../src/config/database');

describe('Performance and Load Tests', () => {
  let authToken;
  let testUsers = [];

  beforeAll(async () => {
    // Create test users for load testing
    const userPromises = Array(5).fill().map((_, index) => 
      query(
        `INSERT INTO users (email, name, roles, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [`loadtest${index}@example.com`, `Load Test User ${index}`, ['user'], true]
      )
    );

    const userResults = await Promise.all(userPromises);
    testUsers = userResults.map(result => result.rows[0]);

    // Generate auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      {
        sub: testUsers[0].id,
        email: testUsers[0].email,
        name: testUsers[0].name,
        roles: testUsers[0].roles
      },
      'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    const emails = testUsers.map(user => user.email);
    await query('DELETE FROM users WHERE email = ANY($1)', [emails]);
  });

  describe('API Response Time Tests', () => {
    it('should respond to user requests within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 50 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle dashboard requests efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Dashboard should respond within 2 seconds
    });

    it('should handle analytics requests efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/analytics/skill-analysis')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Analytics should respond within 3 seconds
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent user requests', async () => {
      const concurrentRequests = Array(20).fill().map(() =>
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // Should handle 20 concurrent requests within reasonable time
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle concurrent dashboard requests', async () => {
      const concurrentRequests = Array(10).fill().map(() =>
        request(app)
          .get('/api/dashboard/overview')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      expect(totalTime).toBeLessThan(10000);
    });

    it('should handle mixed concurrent requests', async () => {
      const mixedRequests = [
        ...Array(5).fill().map(() => request(app).get('/api/users').set('Authorization', `Bearer ${authToken}`)),
        ...Array(5).fill().map(() => request(app).get('/api/resumes').set('Authorization', `Bearer ${authToken}`)),
        ...Array(5).fill().map(() => request(app).get('/api/jobs').set('Authorization', `Bearer ${authToken}`)),
        ...Array(5).fill().map(() => request(app).get('/api/analytics/skill-analysis').set('Authorization', `Bearer ${authToken}`))
      ];

      const startTime = Date.now();
      const responses = await Promise.all(mixedRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      expect(totalTime).toBeLessThan(15000);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle large dataset queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100, page: 1 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle complex analytics queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/analytics/market-trends')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000);
    });

    it('should handle search queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'test', limit: 50 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks during extended usage', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate extended usage
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10 });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits appropriately', async () => {
      const rapidRequests = Array(200).fill().map(() =>
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(rapidRequests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle rate limit recovery', async () => {
      // Make requests until rate limited
      let rateLimited = false;
      let requestCount = 0;
      
      while (!rateLimited && requestCount < 100) {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 429) {
          rateLimited = true;
        }
        requestCount++;
      }

      // Wait for rate limit to reset
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should be able to make requests again
      const recoveryResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(recoveryResponse.status).toBeLessThan(500);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully under load', async () => {
      const errorProneRequests = Array(50).fill().map((_, index) => {
        // Mix valid and invalid requests
        if (index % 10 === 0) {
          return request(app)
            .get('/api/users/invalid-uuid')
            .set('Authorization', `Bearer ${authToken}`);
        } else {
          return request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${authToken}`);
        }
      });

      const responses = await Promise.all(errorProneRequests);
      
      // Valid requests should succeed
      const validResponses = responses.filter((_, index) => index % 10 !== 0);
      validResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Invalid requests should return 404
      const invalidResponses = responses.filter((_, index) => index % 10 === 0);
      invalidResponses.forEach(response => {
        expect(response.status).toBe(404);
      });
    });
  });

  describe('System Resource Tests', () => {
    it('should maintain system stability under load', async () => {
      const initialCpuUsage = process.cpuUsage();
      
      // Generate load
      const loadPromises = Array(100).fill().map(() =>
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
      );

      await Promise.all(loadPromises);
      
      const finalCpuUsage = process.cpuUsage(initialCpuUsage);
      
      // CPU usage should be reasonable
      expect(finalCpuUsage.user + finalCpuUsage.system).toBeLessThan(1000000); // 1 second of CPU time
    });

    it('should handle database connection pooling', async () => {
      // Test database connection stability
      const dbPromises = Array(20).fill().map(async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10 });
        
        return response.status;
      });

      const results = await Promise.all(dbPromises);
      
      // All database operations should succeed
      results.forEach(status => {
        expect(status).toBeLessThan(500);
      });
    });
  });
});





