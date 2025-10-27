const request = require('supertest');
const app = require('./src/server');
const { query } = require('./src/config/database');

// Generate test JWT token
function generateTestToken(userId = '550e8400-e29b-41d4-a716-446655440001', roles = ['admin']) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      sub: userId,
      email: 'test@example.com',
      name: 'Test User',
      roles: roles,
      permissions: ['users:read', 'users:write', 'resumes:read', 'resumes:write', 'analytics:read', 'notifications:write', 'cms:write', 'ai:read', 'ai:write', 'system:read', 'system:write', 'payments:read', 'jobs:read', 'jobs:write']
    },
    process.env.AUTH0_CLIENT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

async function testRoutes() {
  console.log('🚀 Testing Upstar Backend API Routes...\n');
  
  const authToken = generateTestToken();
  const userToken = generateTestToken('550e8400-e29b-41d4-a716-446655440003', ['user']);
  
  const tests = [];
  
  // 1. Dashboard Routes
  tests.push({
    name: 'Dashboard Overview',
    method: 'GET',
    path: '/api/dashboard/overview',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Dashboard Analytics Report',
    method: 'GET',
    path: '/api/dashboard/analytics-report',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 2. Authentication Routes
  tests.push({
    name: 'Auth Verify',
    method: 'POST',
    path: '/api/auth/verify',
    auth: null,
    body: { token: authToken },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Auth Profile',
    method: 'GET',
    path: '/api/auth/profile',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Auth Refresh',
    method: 'POST',
    path: '/api/auth/refresh',
    auth: null,
    body: { refreshToken: 'test-refresh-token' },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Auth Logout',
    method: 'POST',
    path: '/api/auth/logout',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Auth Check Permission',
    method: 'POST',
    path: '/api/auth/check-permission',
    auth: authToken,
    body: { permission: 'users:read' },
    expectedStatus: 200
  });
  
  // 3. Users Routes
  tests.push({
    name: 'Get Users',
    method: 'GET',
    path: '/api/users?page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Users with Search',
    method: 'GET',
    path: '/api/users?search=test&page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Users with Filters',
    method: 'GET',
    path: '/api/users?status=active&role=user&page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get User by ID',
    method: 'GET',
    path: '/api/users/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Update User',
    method: 'PATCH',
    path: '/api/users',
    auth: authToken,
    body: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      roles: ['user', 'moderator'],
      active: true
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Login as User',
    method: 'POST',
    path: '/api/users/550e8400-e29b-41d4-a716-446655440003/login-as',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 4. Resumes Routes
  tests.push({
    name: 'Get Resumes',
    method: 'GET',
    path: '/api/resumes?page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Resumes with Status Filter',
    method: 'GET',
    path: '/api/resumes?status=COMPLETED&page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Resume by ID',
    method: 'GET',
    path: '/api/resumes/550e8400-e29b-41d4-a716-446655440101',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Reprocess Resume',
    method: 'POST',
    path: '/api/resumes/550e8400-e29b-41d4-a716-446655440101/reprocess',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Download Resume',
    method: 'GET',
    path: '/api/resumes/550e8400-e29b-41d4-a716-446655440101/download',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 5. Skills Routes
  tests.push({
    name: 'Get Skills Analytics',
    method: 'GET',
    path: '/api/skills/analytics',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Skills Errors',
    method: 'GET',
    path: '/api/skills/errors?page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Skills Categories',
    method: 'GET',
    path: '/api/skills/categories',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Skills Trends',
    method: 'GET',
    path: '/api/skills/trends',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 6. Jobs Routes
  tests.push({
    name: 'Get Jobs',
    method: 'GET',
    path: '/api/jobs?page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Jobs with Search',
    method: 'GET',
    path: '/api/jobs?search=engineer&page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Jobs with Filters',
    method: 'GET',
    path: '/api/jobs?location=San Francisco&remote=true&page=1&limit=10',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Job by ID',
    method: 'GET',
    path: '/api/jobs/job_001',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Sync Jobs',
    method: 'POST',
    path: '/api/jobs/sync',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Job Analytics',
    method: 'GET',
    path: '/api/jobs/analytics',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 7. Analytics Routes
  tests.push({
    name: 'Get Skill Analysis',
    method: 'GET',
    path: '/api/analytics/skill-analysis',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Market Trends',
    method: 'GET',
    path: '/api/analytics/market-trends',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Job Performance',
    method: 'GET',
    path: '/api/analytics/job-performance',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Geographic Data',
    method: 'GET',
    path: '/api/analytics/geographic',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get User Engagement',
    method: 'GET',
    path: '/api/analytics/user-engagement',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 8. Payments Routes
  tests.push({
    name: 'Get Subscriptions',
    method: 'GET',
    path: '/api/payments/subscriptions',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Transactions',
    method: 'GET',
    path: '/api/payments/transactions',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Payment Analytics',
    method: 'GET',
    path: '/api/payments/analytics',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Process Refund',
    method: 'POST',
    path: '/api/payments/refunds',
    auth: authToken,
    body: {
      transactionId: 'txn_123',
      amount: 19.99,
      reason: 'Customer request'
    },
    expectedStatus: 200
  });
  
  // 9. AI Settings Routes
  tests.push({
    name: 'Get AI Settings',
    method: 'GET',
    path: '/api/ai/settings',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Update AI Settings',
    method: 'PUT',
    path: '/api/ai/settings',
    auth: authToken,
    body: {
      settings: [
        {
          id: 'confidence_threshold',
          value: 0.9
        }
      ]
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get AI Model Status',
    method: 'GET',
    path: '/api/ai/models/status',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Test AI Model',
    method: 'POST',
    path: '/api/ai/models/gpt-4/test',
    auth: authToken,
    body: {
      input: 'Test input for AI model'
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get AI Performance',
    method: 'GET',
    path: '/api/ai/performance',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 10. System Health Routes
  tests.push({
    name: 'Get System Health',
    method: 'GET',
    path: '/api/system/health',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get System Activity',
    method: 'GET',
    path: '/api/system/activity',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get System Alerts',
    method: 'GET',
    path: '/api/system/alerts',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Resolve System Alert',
    method: 'POST',
    path: '/api/system/alerts/550e8400-e29b-41d4-a716-446655440001/resolve',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get System Metrics',
    method: 'GET',
    path: '/api/system/metrics',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 11. Notifications Routes
  tests.push({
    name: 'Get Notification History',
    method: 'GET',
    path: '/api/notifications/history',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Send Notification',
    method: 'POST',
    path: '/api/notifications/send',
    auth: authToken,
    body: {
      title: 'Test Notification',
      content: 'This is a test notification',
      audience: 'All Users',
      schedule: 'now'
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Reminders',
    method: 'GET',
    path: '/api/notifications/reminders',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Create Reminder',
    method: 'POST',
    path: '/api/notifications/reminders',
    auth: authToken,
    body: {
      title: 'New Reminder',
      description: 'Reminder description',
      cadence: 'Weekly'
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Toggle Reminder',
    method: 'POST',
    path: '/api/notifications/reminders/550e8400-e29b-41d4-a716-446655440001/toggle',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Notification Templates',
    method: 'GET',
    path: '/api/notifications/templates',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 12. CMS Routes
  tests.push({
    name: 'Get CMS Articles',
    method: 'GET',
    path: '/api/cms/articles',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Create CMS Article',
    method: 'POST',
    path: '/api/cms/articles',
    auth: authToken,
    body: {
      title: 'Test Article',
      slug: 'test-article',
      content: 'This is a test article',
      status: 'published'
    },
    expectedStatus: 201
  });
  
  tests.push({
    name: 'Get CMS Article by ID',
    method: 'GET',
    path: '/api/cms/articles/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Update CMS Article',
    method: 'PUT',
    path: '/api/cms/articles/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    body: {
      title: 'Updated Article',
      content: 'Updated content'
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Delete CMS Article',
    method: 'DELETE',
    path: '/api/cms/articles/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get CMS Categories',
    method: 'GET',
    path: '/api/cms/categories',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 13. File Upload Routes
  tests.push({
    name: 'Upload Resume',
    method: 'POST',
    path: '/api/upload/resume',
    auth: authToken,
    expectedStatus: 400 // Should fail without file
  });
  
  tests.push({
    name: 'Upload Avatar',
    method: 'POST',
    path: '/api/upload/avatar',
    auth: authToken,
    expectedStatus: 400 // Should fail without file
  });
  
  tests.push({
    name: 'Upload Document',
    method: 'POST',
    path: '/api/upload/document',
    auth: authToken,
    expectedStatus: 400 // Should fail without file
  });
  
  tests.push({
    name: 'Delete File',
    method: 'DELETE',
    path: '/api/upload/delete/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 14. Job Queue Routes
  tests.push({
    name: 'Process Resume Job',
    method: 'POST',
    path: '/api/jobs/process-resume',
    auth: authToken,
    body: {
      resumeId: '550e8400-e29b-41d4-a716-446655440101'
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Match Users Job',
    method: 'POST',
    path: '/api/jobs/match-users',
    auth: authToken,
    body: {
      userId: '550e8400-e29b-41d4-a716-446655440003',
      resumeId: '550e8400-e29b-41d4-a716-446655440101'
    },
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Job Status',
    method: 'GET',
    path: '/api/jobs/status/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Get Queue Stats',
    method: 'GET',
    path: '/api/jobs/queue-stats',
    auth: authToken,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Retry Job',
    method: 'POST',
    path: '/api/jobs/retry/550e8400-e29b-41d4-a716-446655440001',
    auth: authToken,
    expectedStatus: 200
  });
  
  // 15. Health Check Routes
  tests.push({
    name: 'Basic Health Check',
    method: 'GET',
    path: '/api/health',
    auth: null,
    expectedStatus: 200
  });
  
  tests.push({
    name: 'Detailed Health Check',
    method: 'GET',
    path: '/api/health/detailed',
    auth: authToken,
    expectedStatus: 200
  });
  
  // Run all tests
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing ${test.name}...`);
      
      let response;
      const requestBuilder = request(app)[test.method.toLowerCase()](test.path);
      
      if (test.auth) {
        requestBuilder.set('Authorization', `Bearer ${test.auth}`);
      }
      
      if (test.body) {
        requestBuilder.send(test.body);
      }
      
      response = await requestBuilder;
      
      const status = response.status === test.expectedStatus ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name} (${response.status})`);
      
      results.push({
        name: test.name,
        passed: response.status === test.expectedStatus,
        status: response.status,
        expected: test.expectedStatus
      });
      
    } catch (error) {
      console.log(`❌ FAIL ${test.name} - Error: ${error.message}`);
      results.push({
        name: test.name,
        passed: false,
        status: 'ERROR',
        expected: test.expectedStatus,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 Route Test Results Summary:');
  console.log('============================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name} (${result.status})`);
  });
  
  console.log(`\n🎯 Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All route tests passed! Backend API is working correctly.');
  } else {
    console.log('\n⚠️ Some route tests failed. Please check the errors above.');
  }
  
  return { passed, failed, results };
}

// Run tests if this file is executed directly
if (require.main === module) {
  testRoutes()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Route test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testRoutes };






