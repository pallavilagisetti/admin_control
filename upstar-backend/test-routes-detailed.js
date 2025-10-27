const request = require('supertest');
const app = require('./src/server');
const { query } = require('./src/config/database');

// Test data setup
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  try {
    // Check if test data exists
    const usersResult = await query('SELECT COUNT(*) FROM users');
    const skillsResult = await query('SELECT COUNT(*) FROM skills');
    const jobsResult = await query('SELECT COUNT(*) FROM jobs');
    
    console.log(`📊 Database status: ${usersResult.rows[0].count} users, ${skillsResult.rows[0].count} skills, ${jobsResult.rows[0].count} jobs`);
    
    return true;
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
    return false;
  }
}

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

async function testRouteGroup(groupName, routes) {
  console.log(`\n🔍 Testing ${groupName} Routes...`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const route of routes) {
    try {
      console.log(`   Testing ${route.name}...`);
      
      let response;
      const requestBuilder = request(app)[route.method.toLowerCase()](route.path);
      
      if (route.auth) {
        requestBuilder.set('Authorization', `Bearer ${route.auth}`);
      }
      
      if (route.body) {
        requestBuilder.send(route.body);
      }
      
      if (route.query) {
        requestBuilder.query(route.query);
      }
      
      response = await requestBuilder;
      
      const status = response.status === route.expectedStatus ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${route.name} (${response.status})`);
      
      results.push({
        name: route.name,
        passed: response.status === route.expectedStatus,
        status: response.status,
        expected: route.expectedStatus,
        response: response.body
      });
      
    } catch (error) {
      console.log(`   ❌ FAIL ${route.name} - Error: ${error.message}`);
      results.push({
        name: route.name,
        passed: false,
        status: 'ERROR',
        expected: route.expectedStatus,
        error: error.message
      });
    }
  }
  
  return results;
}

async function testAllRoutes() {
  console.log('🚀 Testing All Upstar Backend Routes...\n');
  
  // Setup test data
  const dataSetup = await setupTestData();
  if (!dataSetup) {
    console.log('❌ Test data setup failed. Please run database setup first.');
    return;
  }
  
  const authToken = generateTestToken();
  const userToken = generateTestToken('550e8400-e29b-41d4-a716-446655440003', ['user']);
  
  const allResults = [];
  
  // 1. Dashboard Routes
  const dashboardRoutes = [
    {
      name: 'Dashboard Overview',
      method: 'GET',
      path: '/api/dashboard/overview',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Dashboard Analytics Report',
      method: 'GET',
      path: '/api/dashboard/analytics-report',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Dashboard', dashboardRoutes));
  
  // 2. Authentication Routes
  const authRoutes = [
    {
      name: 'Auth Verify',
      method: 'POST',
      path: '/api/auth/verify',
      auth: null,
      body: { token: authToken },
      expectedStatus: 200
    },
    {
      name: 'Auth Profile',
      method: 'GET',
      path: '/api/auth/profile',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Auth Refresh',
      method: 'POST',
      path: '/api/auth/refresh',
      auth: null,
      body: { refreshToken: 'test-refresh-token' },
      expectedStatus: 200
    },
    {
      name: 'Auth Logout',
      method: 'POST',
      path: '/api/auth/logout',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Auth Check Permission',
      method: 'POST',
      path: '/api/auth/check-permission',
      auth: authToken,
      body: { permission: 'users:read' },
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Authentication', authRoutes));
  
  // 3. Users Routes
  const usersRoutes = [
    {
      name: 'Get Users',
      method: 'GET',
      path: '/api/users',
      auth: authToken,
      query: { page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Users with Search',
      method: 'GET',
      path: '/api/users',
      auth: authToken,
      query: { search: 'test', page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Users with Filters',
      method: 'GET',
      path: '/api/users',
      auth: authToken,
      query: { status: 'active', role: 'user', page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get User by ID',
      method: 'GET',
      path: '/api/users/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      expectedStatus: 200
    },
    {
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
    },
    {
      name: 'Login as User',
      method: 'POST',
      path: '/api/users/550e8400-e29b-41d4-a716-446655440003/login-as',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Users', usersRoutes));
  
  // 4. Resumes Routes
  const resumesRoutes = [
    {
      name: 'Get Resumes',
      method: 'GET',
      path: '/api/resumes',
      auth: authToken,
      query: { page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Resumes with Status Filter',
      method: 'GET',
      path: '/api/resumes',
      auth: authToken,
      query: { status: 'COMPLETED', page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Resume by ID',
      method: 'GET',
      path: '/api/resumes/550e8400-e29b-41d4-a716-446655440101',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Reprocess Resume',
      method: 'POST',
      path: '/api/resumes/550e8400-e29b-41d4-a716-446655440101/reprocess',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Download Resume',
      method: 'GET',
      path: '/api/resumes/550e8400-e29b-41d4-a716-446655440101/download',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Resumes', resumesRoutes));
  
  // 5. Skills Routes
  const skillsRoutes = [
    {
      name: 'Get Skills Analytics',
      method: 'GET',
      path: '/api/skills/analytics',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Skills Errors',
      method: 'GET',
      path: '/api/skills/errors',
      auth: authToken,
      query: { page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Skills Categories',
      method: 'GET',
      path: '/api/skills/categories',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Skills Trends',
      method: 'GET',
      path: '/api/skills/trends',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Skills', skillsRoutes));
  
  // 6. Jobs Routes
  const jobsRoutes = [
    {
      name: 'Get Jobs',
      method: 'GET',
      path: '/api/jobs',
      auth: authToken,
      query: { page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Jobs with Search',
      method: 'GET',
      path: '/api/jobs',
      auth: authToken,
      query: { search: 'engineer', page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Jobs with Filters',
      method: 'GET',
      path: '/api/jobs',
      auth: authToken,
      query: { location: 'San Francisco', remote: true, page: 1, limit: 10 },
      expectedStatus: 200
    },
    {
      name: 'Get Job by ID',
      method: 'GET',
      path: '/api/jobs/job_001',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Sync Jobs',
      method: 'POST',
      path: '/api/jobs/sync',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Job Analytics',
      method: 'GET',
      path: '/api/jobs/analytics',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Jobs', jobsRoutes));
  
  // 7. Analytics Routes
  const analyticsRoutes = [
    {
      name: 'Get Skill Analysis',
      method: 'GET',
      path: '/api/analytics/skill-analysis',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Market Trends',
      method: 'GET',
      path: '/api/analytics/market-trends',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Job Performance',
      method: 'GET',
      path: '/api/analytics/job-performance',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Geographic Data',
      method: 'GET',
      path: '/api/analytics/geographic',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get User Engagement',
      method: 'GET',
      path: '/api/analytics/user-engagement',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Analytics', analyticsRoutes));
  
  // 8. Payments Routes
  const paymentsRoutes = [
    {
      name: 'Get Subscriptions',
      method: 'GET',
      path: '/api/payments/subscriptions',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Transactions',
      method: 'GET',
      path: '/api/payments/transactions',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Payment Analytics',
      method: 'GET',
      path: '/api/payments/analytics',
      auth: authToken,
      expectedStatus: 200
    },
    {
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
    }
  ];
  
  allResults.push(...await testRouteGroup('Payments', paymentsRoutes));
  
  // 9. AI Settings Routes
  const aiRoutes = [
    {
      name: 'Get AI Settings',
      method: 'GET',
      path: '/api/ai/settings',
      auth: authToken,
      expectedStatus: 200
    },
    {
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
    },
    {
      name: 'Get AI Model Status',
      method: 'GET',
      path: '/api/ai/models/status',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Test AI Model',
      method: 'POST',
      path: '/api/ai/models/gpt-4/test',
      auth: authToken,
      body: {
        input: 'Test input for AI model'
      },
      expectedStatus: 200
    },
    {
      name: 'Get AI Performance',
      method: 'GET',
      path: '/api/ai/performance',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('AI Settings', aiRoutes));
  
  // 10. System Health Routes
  const systemRoutes = [
    {
      name: 'Get System Health',
      method: 'GET',
      path: '/api/system/health',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get System Activity',
      method: 'GET',
      path: '/api/system/activity',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get System Alerts',
      method: 'GET',
      path: '/api/system/alerts',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Resolve System Alert',
      method: 'POST',
      path: '/api/system/alerts/550e8400-e29b-41d4-a716-446655440001/resolve',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get System Metrics',
      method: 'GET',
      path: '/api/system/metrics',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('System Health', systemRoutes));
  
  // 11. Notifications Routes
  const notificationRoutes = [
    {
      name: 'Get Notification History',
      method: 'GET',
      path: '/api/notifications/history',
      auth: authToken,
      expectedStatus: 200
    },
    {
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
    },
    {
      name: 'Get Reminders',
      method: 'GET',
      path: '/api/notifications/reminders',
      auth: authToken,
      expectedStatus: 200
    },
    {
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
    },
    {
      name: 'Toggle Reminder',
      method: 'POST',
      path: '/api/notifications/reminders/550e8400-e29b-41d4-a716-446655440001/toggle',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Notification Templates',
      method: 'GET',
      path: '/api/notifications/templates',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Notifications', notificationRoutes));
  
  // 12. CMS Routes
  const cmsRoutes = [
    {
      name: 'Get CMS Articles',
      method: 'GET',
      path: '/api/cms/articles',
      auth: authToken,
      expectedStatus: 200
    },
    {
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
    },
    {
      name: 'Get CMS Article by ID',
      method: 'GET',
      path: '/api/cms/articles/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Update CMS Article',
      method: 'PUT',
      path: '/api/cms/articles/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      body: {
        title: 'Updated Article',
        content: 'Updated content'
      },
      expectedStatus: 200
    },
    {
      name: 'Delete CMS Article',
      method: 'DELETE',
      path: '/api/cms/articles/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get CMS Categories',
      method: 'GET',
      path: '/api/cms/categories',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('CMS', cmsRoutes));
  
  // 13. File Upload Routes
  const uploadRoutes = [
    {
      name: 'Upload Resume',
      method: 'POST',
      path: '/api/upload/resume',
      auth: authToken,
      expectedStatus: 400 // Should fail without file
    },
    {
      name: 'Upload Avatar',
      method: 'POST',
      path: '/api/upload/avatar',
      auth: authToken,
      expectedStatus: 400 // Should fail without file
    },
    {
      name: 'Upload Document',
      method: 'POST',
      path: '/api/upload/document',
      auth: authToken,
      expectedStatus: 400 // Should fail without file
    },
    {
      name: 'Delete File',
      method: 'DELETE',
      path: '/api/upload/delete/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('File Upload', uploadRoutes));
  
  // 14. Job Queue Routes
  const jobQueueRoutes = [
    {
      name: 'Process Resume Job',
      method: 'POST',
      path: '/api/jobs/process-resume',
      auth: authToken,
      body: {
        resumeId: '550e8400-e29b-41d4-a716-446655440101'
      },
      expectedStatus: 200
    },
    {
      name: 'Match Users Job',
      method: 'POST',
      path: '/api/jobs/match-users',
      auth: authToken,
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440003',
        resumeId: '550e8400-e29b-41d4-a716-446655440101'
      },
      expectedStatus: 200
    },
    {
      name: 'Get Job Status',
      method: 'GET',
      path: '/api/jobs/status/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Get Queue Stats',
      method: 'GET',
      path: '/api/jobs/queue-stats',
      auth: authToken,
      expectedStatus: 200
    },
    {
      name: 'Retry Job',
      method: 'POST',
      path: '/api/jobs/retry/550e8400-e29b-41d4-a716-446655440001',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Job Queue', jobQueueRoutes));
  
  // 15. Health Check Routes
  const healthRoutes = [
    {
      name: 'Basic Health Check',
      method: 'GET',
      path: '/api/health',
      auth: null,
      expectedStatus: 200
    },
    {
      name: 'Detailed Health Check',
      method: 'GET',
      path: '/api/health/detailed',
      auth: authToken,
      expectedStatus: 200
    }
  ];
  
  allResults.push(...await testRouteGroup('Health Check', healthRoutes));
  
  // Summary
  console.log('\n📊 Complete Route Test Results:');
  console.log('==============================');
  
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  
  allResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name} (${result.status})`);
  });
  
  console.log(`\n🎯 Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All route tests passed! Backend API is fully functional.');
  } else {
    console.log('\n⚠️ Some route tests failed. Please check the errors above.');
  }
  
  return { passed, failed, results: allResults };
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAllRoutes()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Route test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllRoutes };






