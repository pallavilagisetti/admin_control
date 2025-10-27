const { connectDB, query, cache } = require('./src/config/database');
const { resumeProcessingQueue, jobMatchingQueue, emailQueue, dataSyncQueue, analyticsQueue } = require('./src/jobs/processors');
const AIService = require('./src/services/AIService');
const S3Service = require('./src/services/S3Service');
const EmailService = require('./src/services/EmailService');
const request = require('supertest');
const app = require('./src/server');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  try {
    await connectDB();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database query test passed:', result.rows[0].current_time);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testDatabaseTables() {
  console.log('\n🔍 Testing Database Tables...');
  try {
    // Check if all required tables exist
    const tables = [
      'users', 'skills', 'user_skills', 'resumes', 'jobs', 'user_job_matches',
      'payments', 'subscriptions', 'notifications', 'notification_recipients',
      'reminders', 'cms_articles', 'cms_categories', 'documents',
      'resume_processing_errors', 'system_alerts', 'notification_templates',
      'api_logs', 'audit_logs', 'slow_requests', 'slow_queries',
      'system_metrics', 'error_logs', 'performance_metrics',
      'user_activity_logs', 'security_events', 'analytics_reports'
    ];
    
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}' exists (${result.rows[0].count} records)`);
      } catch (error) {
        console.log(`❌ Table '${table}' missing or error:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database tables test failed:', error.message);
    return false;
  }
}

async function testRedisConnection() {
  console.log('\n🔍 Testing Redis Connection...');
  try {
    // Test cache operations
    await cache.set('test_key', 'test_value', 60);
    const value = await cache.get('test_key');
    
    if (value === 'test_value') {
      console.log('✅ Redis connection successful');
      await cache.del('test_key');
      return true;
    } else {
      console.log('❌ Redis cache test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
}

async function testJobQueues() {
  console.log('\n🔍 Testing Job Queues...');
  try {
    const queues = [
      { name: 'Resume Processing', queue: resumeProcessingQueue },
      { name: 'Job Matching', queue: jobMatchingQueue },
      { name: 'Email Notifications', queue: emailQueue },
      { name: 'Data Sync', queue: dataSyncQueue },
      { name: 'Analytics', queue: analyticsQueue }
    ];
    
    for (const { name, queue } of queues) {
      try {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();
        
        console.log(`✅ ${name} Queue: ${waiting.length} waiting, ${active.length} active, ${completed.length} completed, ${failed.length} failed`);
      } catch (error) {
        console.log(`❌ ${name} Queue error:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Job queues test failed:', error.message);
    return false;
  }
}

async function testAIService() {
  console.log('\n🔍 Testing AI Service...');
  try {
    // Test AI model status
    const status = await AIService.getModelStatus();
    console.log('✅ AI Service status:', status.status);
    
    // Test AI model with simple input
    const testResult = await AIService.testModel('Hello, this is a test message.');
    if (testResult.success) {
      console.log('✅ AI Service test passed');
      return true;
    } else {
      console.log('❌ AI Service test failed:', testResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ AI Service test failed:', error.message);
    return false;
  }
}

async function testS3Service() {
  console.log('\n🔍 Testing S3 Service...');
  try {
    // Test S3 configuration
    const bucketStats = await S3Service.getBucketStats();
    console.log('✅ S3 Service connection successful');
    console.log(`   Total files: ${bucketStats.stats.totalFiles}`);
    console.log(`   Total size: ${bucketStats.stats.totalSize} bytes`);
    return true;
  } catch (error) {
    console.error('❌ S3 Service test failed:', error.message);
    return false;
  }
}

async function testEmailService() {
  console.log('\n🔍 Testing Email Service...');
  try {
    // Test email configuration
    const config = await EmailService.verifyConfiguration();
    if (config.success) {
      console.log('✅ Email Service configuration valid');
      return true;
    } else {
      console.log('❌ Email Service configuration invalid:', config.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Email Service test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🔍 Testing API Endpoints...');
  try {
    // Test health endpoint
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200);
    
    console.log('✅ Health endpoint working');
    
    // Test database health
    const dbHealthResponse = await request(app)
      .get('/api/system/health')
      .expect(401); // Should require authentication
    
    console.log('✅ System health endpoint requires authentication');
    
    return true;
  } catch (error) {
    console.error('❌ API endpoints test failed:', error.message);
    return false;
  }
}

async function testDatabaseMigrations() {
  console.log('\n🔍 Testing Database Migrations...');
  try {
    // Check migration status
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('node database/migrate.js status');
    console.log('✅ Migration status:');
    console.log(stdout);
    
    return true;
  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    return false;
  }
}

async function testDatabaseSeeds() {
  console.log('\n🔍 Testing Database Seeds...');
  try {
    // Check seed status
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('node database/seed.js status');
    console.log('✅ Seed status:');
    console.log(stdout);
    
    return true;
  } catch (error) {
    console.error('❌ Seed test failed:', error.message);
    return false;
  }
}

async function testSampleData() {
  console.log('\n🔍 Testing Sample Data...');
  try {
    // Test users table
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table: ${usersResult.rows[0].count} records`);
    
    // Test skills table
    const skillsResult = await query('SELECT COUNT(*) as count FROM skills');
    console.log(`✅ Skills table: ${skillsResult.rows[0].count} records`);
    
    // Test jobs table
    const jobsResult = await query('SELECT COUNT(*) as count FROM jobs');
    console.log(`✅ Jobs table: ${jobsResult.rows[0].count} records`);
    
    // Test resumes table
    const resumesResult = await query('SELECT COUNT(*) as count FROM resumes');
    console.log(`✅ Resumes table: ${resumesResult.rows[0].count} records`);
    
    return true;
  } catch (error) {
    console.error('❌ Sample data test failed:', error.message);
    return false;
  }
}

async function testDatabasePerformance() {
  console.log('\n🔍 Testing Database Performance...');
  try {
    const startTime = Date.now();
    
    // Test complex query performance
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(r.id) as resume_count,
        COUNT(jm.job_id) as job_matches
      FROM users u
      LEFT JOIN resumes r ON u.id = r.user_id
      LEFT JOIN user_job_matches jm ON u.id = jm.user_id
      GROUP BY u.id, u.name, u.email
      LIMIT 10
    `);
    
    const endTime = Date.now();
    const queryTime = endTime - startTime;
    
    console.log(`✅ Complex query executed in ${queryTime}ms`);
    console.log(`   Returned ${result.rows.length} records`);
    
    if (queryTime < 1000) {
      console.log('✅ Database performance is good');
      return true;
    } else {
      console.log('⚠️ Database performance is slow');
      return false;
    }
  } catch (error) {
    console.error('❌ Database performance test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Backend Database Tests...\n');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Database Tables', fn: testDatabaseTables },
    { name: 'Redis Connection', fn: testRedisConnection },
    { name: 'Job Queues', fn: testJobQueues },
    { name: 'AI Service', fn: testAIService },
    { name: 'S3 Service', fn: testS3Service },
    { name: 'Email Service', fn: testEmailService },
    { name: 'API Endpoints', fn: testAPIEndpoints },
    { name: 'Database Migrations', fn: testDatabaseMigrations },
    { name: 'Database Seeds', fn: testDatabaseSeeds },
    { name: 'Sample Data', fn: testSampleData },
    { name: 'Database Performance', fn: testDatabasePerformance }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
  
  return { passed, failed, results };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDatabaseConnection,
  testDatabaseTables,
  testRedisConnection,
  testJobQueues,
  testAIService,
  testS3Service,
  testEmailService,
  testAPIEndpoints,
  testDatabaseMigrations,
  testDatabaseSeeds,
  testSampleData,
  testDatabasePerformance
};






