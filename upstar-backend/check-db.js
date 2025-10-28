const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || '54.254.3.87',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'localpass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAndCreateTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing tables...');
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    // Check if jobs table exists
    const jobsExists = tablesResult.rows.some(row => row.table_name === 'jobs');
    const skillsExists = tablesResult.rows.some(row => row.table_name === 'skills');
    
    console.log(`Jobs table exists: ${jobsExists}`);
    console.log(`Skills table exists: ${skillsExists}`);
    
    if (!jobsExists || !skillsExists) {
      console.log('🔧 Creating missing tables...');
      
      // Create jobs table if it doesn't exist
      if (!jobsExists) {
        await client.query(`
          CREATE TABLE jobs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            external_id VARCHAR(255) UNIQUE,
            title VARCHAR(255) NOT NULL,
            organization VARCHAR(255),
            location VARCHAR(255),
            employment_type TEXT[],
            remote BOOLEAN DEFAULT false,
            description TEXT,
            requirements TEXT,
            benefits TEXT[],
            skills TEXT[],
            salary_min INTEGER,
            salary_max INTEGER,
            salary_currency VARCHAR(3) DEFAULT 'USD',
            application_url VARCHAR(500),
            date_posted TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Jobs table created');
      }
      
      // Create skills table if it doesn't exist
      if (!skillsExists) {
        await client.query(`
          CREATE TABLE skills (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            category VARCHAR(100),
            market_demand_score INTEGER DEFAULT 0,
            growth_rate DECIMAL(5,2) DEFAULT 0,
            avg_salary DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Skills table created');
      }
      
      // Create user_skills table if it doesn't exist
      const userSkillsExists = tablesResult.rows.some(row => row.table_name === 'user_skills');
      if (!userSkillsExists) {
        await client.query(`
          CREATE TABLE user_skills (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
            experience_years DECIMAL(3,1) DEFAULT 0,
            proficiency_level VARCHAR(20) DEFAULT 'beginner',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, skill_id)
          )
        `);
        console.log('✅ User skills table created');
      }
      
      // Create user_job_matches table if it doesn't exist
      const userJobMatchesExists = tablesResult.rows.some(row => row.table_name === 'user_job_matches');
      if (!userJobMatchesExists) {
        await client.query(`
          CREATE TABLE user_job_matches (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
            match_score DECIMAL(5,2),
            viewed BOOLEAN DEFAULT false,
            applied BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, job_id)
          )
        `);
        console.log('✅ User job matches table created');
      }
      
      // Insert sample data
      console.log('🌱 Inserting sample data...');
      
      // Insert sample skills
      await client.query(`
        INSERT INTO skills (name, category, market_demand_score, growth_rate, avg_salary) VALUES
        ('JavaScript', 'Programming Languages', 95, 15.2, 95000),
        ('Python', 'Programming Languages', 92, 18.5, 105000),
        ('React', 'Frontend Frameworks', 88, 22.1, 98000),
        ('Node.js', 'Backend Technologies', 85, 16.8, 92000),
        ('SQL', 'Databases', 90, 12.3, 88000),
        ('AWS', 'Cloud Platforms', 87, 25.4, 110000),
        ('Docker', 'DevOps', 82, 28.7, 102000),
        ('Machine Learning', 'AI/ML', 94, 35.2, 125000),
        ('Data Science', 'Analytics', 89, 20.1, 108000),
        ('DevOps', 'Infrastructure', 86, 24.6, 115000)
        ON CONFLICT (name) DO NOTHING
      `);
      
      // Insert sample jobs
      await client.query(`
        INSERT INTO jobs (external_id, title, organization, location, employment_type, remote, description, skills, salary_min, salary_max, salary_currency, date_posted) VALUES
        ('job_001', 'Senior Software Engineer', 'Tech Corp', 'San Francisco, CA', ARRAY['FULL_TIME'], true, 'We are looking for a senior software engineer to join our team...', ARRAY['JavaScript', 'React', 'Node.js', 'AWS'], 120000, 180000, 'USD', NOW() - INTERVAL '1 day'),
        ('job_002', 'Full Stack Developer', 'StartupXYZ', 'New York, NY', ARRAY['FULL_TIME'], false, 'Join our fast-growing startup as a full stack developer...', ARRAY['Python', 'Django', 'React', 'PostgreSQL'], 90000, 130000, 'USD', NOW() - INTERVAL '2 days'),
        ('job_003', 'DevOps Engineer', 'CloudTech', 'Seattle, WA', ARRAY['FULL_TIME'], true, 'Looking for a DevOps engineer to manage our cloud infrastructure...', ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform'], 110000, 160000, 'USD', NOW() - INTERVAL '3 days'),
        ('job_004', 'Data Scientist', 'Analytics Inc', 'Boston, MA', ARRAY['FULL_TIME'], false, 'Join our data science team to build ML models...', ARRAY['Python', 'Machine Learning', 'Data Science', 'SQL'], 100000, 150000, 'USD', NOW() - INTERVAL '4 days'),
        ('job_005', 'Frontend Developer', 'WebStudio', 'Austin, TX', ARRAY['FULL_TIME'], true, 'Create beautiful user interfaces with modern frameworks...', ARRAY['React', 'JavaScript', 'CSS', 'HTML'], 80000, 120000, 'USD', NOW() - INTERVAL '5 days')
        ON CONFLICT (external_id) DO NOTHING
      `);
      
      console.log('✅ Sample data inserted');
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  checkAndCreateTables()
    .then(() => {
      console.log('Database check completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndCreateTables };
