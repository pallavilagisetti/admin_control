const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runRouteTests() {
  console.log('🚀 Running Upstar Backend Route Tests...\n');
  
  const tests = [
    {
      name: 'Database Setup',
      command: 'npm run setup:db',
      description: 'Setting up database with migrations and seeds'
    },
    {
      name: 'Basic Route Tests',
      command: 'npm run test:routes',
      description: 'Testing all API routes with basic functionality'
    },
    {
      name: 'Detailed Route Tests',
      command: 'npm run test:routes:detailed',
      description: 'Testing all API routes with detailed analysis'
    },
    {
      name: 'Backend Service Tests',
      command: 'npm run test:backend',
      description: 'Testing backend services and database connections'
    },
    {
      name: 'API Endpoint Tests',
      command: 'npm run test:api',
      description: 'Testing API endpoints and authentication'
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
  console.log('\n📊 Route Test Results Summary:');
  console.log('===============================');
  
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
    console.log('\n🎉 All route tests passed! Backend API is fully functional.');
    console.log('\n🚀 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000/api/health to check API health');
    console.log('3. Visit http://localhost:3000/api/docs to view API documentation');
    console.log('4. Use the Postman collection for API testing');
    console.log('5. Test individual routes with curl or Postman');
  } else {
    console.log('\n⚠️ Some route tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running and accessible');
    console.log('2. Check your database connection in .env file');
    console.log('3. Ensure Redis is running for job queues');
    console.log('4. Verify all environment variables are set correctly');
    console.log('5. Check that all dependencies are installed: npm install');
  }
  
  return { passed, failed, results };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRouteTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Route test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runRouteTests };






