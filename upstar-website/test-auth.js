const { Pool } = require('pg');

console.log('🔍 Testing different authentication methods...');
console.log('');

// Test 1: Basic connection
async function testBasicConnection() {
  console.log('🔄 Test 1: Basic connection with explicit config');
  const pool1 = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'resume_db',
    user: 'developer',
    password: 'localpass',
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const client = await pool1.connect();
    console.log('✅ Basic connection successful!');
    const result = await client.query('SELECT current_user, current_database()');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    client.release();
    await pool1.end();
  } catch (error) {
    console.log(`❌ Basic connection failed: ${error.message}`);
  }
}

// Test 2: Connection string
async function testConnectionString() {
  console.log('\n🔄 Test 2: Connection string');
  const pool2 = new Pool({
    connectionString: 'postgresql://developer:localpass@localhost:5432/resume_db',
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const client = await pool2.connect();
    console.log('✅ Connection string successful!');
    const result = await client.query('SELECT current_user, current_database()');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    client.release();
    await pool2.end();
  } catch (error) {
    console.log(`❌ Connection string failed: ${error.message}`);
  }
}

// Test 3: Try with different user
async function testDifferentUser() {
  console.log('\n🔄 Test 3: Trying with postgres user');
  const pool3 = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'resume_db',
    user: 'postgres',
    password: 'localpass',
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const client = await pool3.connect();
    console.log('✅ Postgres user connection successful!');
    const result = await client.query('SELECT current_user, current_database()');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    client.release();
    await pool3.end();
  } catch (error) {
    console.log(`❌ Postgres user failed: ${error.message}`);
  }
}

// Test 4: Try connecting to postgres database first
async function testPostgresDatabase() {
  console.log('\n🔄 Test 4: Connecting to postgres database first');
  const pool4 = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'developer',
    password: 'localpass',
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const client = await pool4.connect();
    console.log('✅ Postgres database connection successful!');
    const result = await client.query('SELECT current_user, current_database()');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    client.release();
    await pool4.end();
  } catch (error) {
    console.log(`❌ Postgres database failed: ${error.message}`);
  }
}

async function runAllTests() {
  await testBasicConnection();
  await testConnectionString();
  await testDifferentUser();
  await testPostgresDatabase();
  
  console.log('\n🏁 All tests completed');
}

runAllTests();








