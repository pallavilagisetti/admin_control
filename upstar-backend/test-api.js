const request = require('supertest');
const app = require('./src/server');
const { query } = require('./src/config/database');

async function testAPIEndpoints() {
  console.log('🚀 Testing Upstar Backend API Endpoints...\n');
  
  const tests = [];
  
  // Test 1: Health Check
  tests.push({
    name: 'Health Check',
    test: async () => {
      const response = await request(app).get('/api/health');
      return response.status === 200;
    }
  });
  
  // Test 2: Database Health
  tests.push({
    name: 'Database Health',
    test: async () => {
      const response = await request(app).get('/api/system/health');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 3: API Documentation
  tests.push({
    name: 'API Documentation',
    test: async () => {
      const response = await request(app).get('/api/docs');
      return response.status === 200;
    }
  });
  
  // Test 4: Database Connection
  tests.push({
    name: 'Database Connection',
    test: async () => {
      const result = await query('SELECT COUNT(*) FROM users');
      return result.rows.length > 0;
    }
  });
  
  // Test 5: Database Tables
  tests.push({
    name: 'Database Tables',
    test: async () => {
      const tables = [
        'users', 'skills', 'resumes', 'jobs', 'user_job_matches',
        'payments', 'subscriptions', 'notifications', 'cms_articles'
      ];
      
      for (const table of tables) {
        await query(`SELECT COUNT(*) FROM ${table}`);
      }
      return true;
    }
  });
  
  // Test 6: Sample Data
  tests.push({
    name: 'Sample Data',
    test: async () => {
      const usersResult = await query('SELECT COUNT(*) as count FROM users');
      const skillsResult = await query('SELECT COUNT(*) as count FROM skills');
      const jobsResult = await query('SELECT COUNT(*) as count FROM jobs');
      
      return usersResult.rows[0].count > 0 && 
             skillsResult.rows[0].count > 0 && 
             jobsResult.rows[0].count > 0;
    }
  });
  
  // Test 7: Authentication Endpoints
  tests.push({
    name: 'Authentication Endpoints',
    test: async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'invalid-token' });
      return response.status === 400; // Should return validation error
    }
  });
  
  // Test 8: User Endpoints (without auth)
  tests.push({
    name: 'User Endpoints',
    test: async () => {
      const response = await request(app).get('/api/users');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 9: Resume Endpoints (without auth)
  tests.push({
    name: 'Resume Endpoints',
    test: async () => {
      const response = await request(app).get('/api/resumes');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 10: Skills Endpoints (without auth)
  tests.push({
    name: 'Skills Endpoints',
    test: async () => {
      const response = await request(app).get('/api/skills/analytics');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 11: Jobs Endpoints (without auth)
  tests.push({
    name: 'Jobs Endpoints',
    test: async () => {
      const response = await request(app).get('/api/jobs');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 12: Analytics Endpoints (without auth)
  tests.push({
    name: 'Analytics Endpoints',
    test: async () => {
      const response = await request(app).get('/api/analytics/skill-analysis');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 13: Payments Endpoints (without auth)
  tests.push({
    name: 'Payments Endpoints',
    test: async () => {
      const response = await request(app).get('/api/payments/subscriptions');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 14: AI Settings Endpoints (without auth)
  tests.push({
    name: 'AI Settings Endpoints',
    test: async () => {
      const response = await request(app).get('/api/ai/settings');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 15: System Health Endpoints (without auth)
  tests.push({
    name: 'System Health Endpoints',
    test: async () => {
      const response = await request(app).get('/api/system/health');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 16: Notifications Endpoints (without auth)
  tests.push({
    name: 'Notifications Endpoints',
    test: async () => {
      const response = await request(app).get('/api/notifications/history');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 17: CMS Endpoints (without auth)
  tests.push({
    name: 'CMS Endpoints',
    test: async () => {
      const response = await request(app).get('/api/cms/articles');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 18: File Upload Endpoints (without auth)
  tests.push({
    name: 'File Upload Endpoints',
    test: async () => {
      const response = await request(app).post('/api/upload/resume');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 19: Job Queue Endpoints (without auth)
  tests.push({
    name: 'Job Queue Endpoints',
    test: async () => {
      const response = await request(app).get('/api/jobs/queue-stats');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Test 20: Detailed Health Endpoints (without auth)
  tests.push({
    name: 'Detailed Health Endpoints',
    test: async () => {
      const response = await request(app).get('/api/health/detailed');
      return response.status === 401; // Should require authentication
    }
  });
  
  // Run all tests
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing ${test.name}...`);
      const result = await test.test();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ FAIL ${test.name} - Error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n📊 API Test Results Summary:');
  console.log('============================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`🎯 Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All API tests passed! Backend is ready for use.');
  } else {
    console.log('\n⚠️ Some API tests failed. Please check the errors above.');
  }
  
  return { passed, failed, results };
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPIEndpoints()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ API test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPIEndpoints };





