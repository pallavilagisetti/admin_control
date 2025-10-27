const { Pool } = require('pg');

console.log('🔍 Testing connection to container IP address...');
console.log('');

async function testContainerIP() {
  const pool = new Pool({
    host: '172.17.0.2',  // Container IP
    port: 5432,
    database: 'resume_db',
    user: 'developer',
    password: 'localpass',
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('🔄 Testing connection to container IP: 172.17.0.2');
    const client = await pool.connect();
    console.log('✅ Container IP connection successful!');
    
    const result = await client.query('SELECT current_user, current_database(), inet_server_addr(), inet_server_port()');
    console.log('📊 Connection info:');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Server IP: ${result.rows[0].inet_server_addr}`);
    console.log(`   Server Port: ${result.rows[0].inet_server_port}`);
    
    client.release();
    await pool.end();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Container IP connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Detail: ${error.detail || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Container IP not accessible from host');
    } else if (error.code === '28P01') {
      console.error('💡 Password authentication failed even with container IP');
    }
    
    process.exit(1);
  }
}

testContainerIP();









