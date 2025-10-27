const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function setupDatabase() {
  console.log('🚀 Setting up Upstar Backend Database...\n');
  
  try {
    // Step 1: Run migrations
    console.log('📦 Running database migrations...');
    const { stdout: migrateOutput } = await execAsync('node database/migrate.js up');
    console.log('✅ Migrations completed');
    console.log(migrateOutput);
    
    // Step 2: Run seeds
    console.log('\n🌱 Running database seeds...');
    const { stdout: seedOutput } = await execAsync('node database/seed.js run');
    console.log('✅ Seeds completed');
    console.log(seedOutput);
    
    // Step 3: Check migration status
    console.log('\n📊 Checking migration status...');
    const { stdout: migrateStatus } = await execAsync('node database/migrate.js status');
    console.log('Migration Status:');
    console.log(migrateStatus);
    
    // Step 4: Check seed status
    console.log('\n📊 Checking seed status...');
    const { stdout: seedStatus } = await execAsync('node database/seed.js status');
    console.log('Seed Status:');
    console.log(seedStatus);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev (to start the development server)');
    console.log('2. Run: node test-backend.js (to test the backend)');
    console.log('3. Visit: http://localhost:3000/api/health (to check API health)');
    console.log('4. Visit: http://localhost:3000/api/docs (to view API documentation)');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your database connection in .env file');
    console.log('3. Ensure Redis is running for job queues');
    console.log('4. Verify all environment variables are set correctly');
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };






