const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runAllTests() {
  console.log('🚀 Running Complete Backend Test Suite...\n');
  
  const tests = [
    {
      name: 'Database Setup',
      command: 'node setup-database.js',
      description: 'Setting up database with migrations and seeds'
    },
    {
      name: 'Backend Tests',
      command: 'node test-backend.js',
      description: 'Testing database connections, services, and job queues'
    },
    {
      name: 'API Tests',
      command: 'node test-api.js',
      description: 'Testing all API endpoints and authentication'
    },
    {
      name: 'Unit Tests',
      command: 'npm test',
      description: 'Running unit tests with Jest'
    },
    {
      name: 'Integration Tests',
      command: 'npm run test:integration',
      description: 'Running integration tests'
    },
    {
      name: 'E2E Tests',
      command: 'npm run test:e2e',
      description: 'Running end-to-end tests'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Running ${test.name}...`);
      console.log(`   ${test.description}`);
      
      const { stdout, stderr } = await execAsync(test.command);
      
      if (stderr && !stderr.includes('warning')) {
        console.log(`❌ ${test.name} failed with errors:`);
        console.log(stderr);
        results.push({ name: test.name, passed: false, error: stderr });
      } else {
        console.log(`✅ ${test.name} completed successfully`);
        results.push({ name: test.name, passed: true });
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Complete Test Suite Results:');
  console.log('================================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is fully functional and ready for production.');
    console.log('\n🚀 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000/api/health to check API health');
    console.log('3. Visit http://localhost:3000/api/docs to view API documentation');
    console.log('4. Use the Postman collection for API testing');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above and fix them before proceeding.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running and accessible');
    console.log('2. Check your database connection in env.local file');
    console.log('3. Ensure Redis is running for job queues');
    console.log('4. Verify all environment variables are set correctly');
    console.log('5. Check that all dependencies are installed: npm install');
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

module.exports = { runAllTests };






