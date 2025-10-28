const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✅ Database schema created successfully');
    
    // Insert sample data
    await insertSampleData(client);
    console.log('✅ Sample data inserted successfully');
    
    console.log('🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function insertSampleData(client) {
  // Insert sample users
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@upstar.com',
      name: 'Admin User',
      roles: ['admin'],
      subscription_tier: 'enterprise'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'moderator@upstar.com',
      name: 'Moderator User',
      roles: ['moderator'],
      subscription_tier: 'pro'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'user@upstar.com',
      name: 'Regular User',
      roles: ['user'],
      subscription_tier: 'free'
    }
  ];

  for (const user of users) {
    await client.query(
      `INSERT INTO users (id, email, name, roles, subscription_tier, active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, user.name, user.roles, user.subscription_tier]
    );
  }

  // Insert sample resumes
  const resumes = [
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      filename: 'john_doe_resume.pdf',
      processing_status: 'COMPLETED',
      extracted_text: 'John Doe - Software Engineer with 5 years of experience in JavaScript, React, and Node.js...',
      structured_data: JSON.stringify({
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        education: 'Bachelor of Computer Science',
        experience: '5 years of software development experience',
        summary: 'Experienced full-stack developer with expertise in modern web technologies'
      })
    }
  ];

  for (const resume of resumes) {
    await client.query(
      `INSERT INTO resumes (id, user_id, filename, processing_status, extracted_text, structured_data, uploaded_at, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
       ON CONFLICT (id) DO NOTHING`,
      [resume.id, resume.user_id, resume.filename, resume.processing_status, resume.extracted_text, resume.structured_data]
    );
  }

  // Insert sample jobs
  const jobs = [
    {
      external_id: 'job_001',
      title: 'Senior Software Engineer',
      organization: 'Tech Corp',
      location: 'San Francisco, CA',
      employment_type: ['FULL_TIME'],
      remote: true,
      description: 'We are looking for a senior software engineer to join our team...',
      skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
      salary_min: 120000,
      salary_max: 180000,
      salary_currency: 'USD'
    },
    {
      external_id: 'job_002',
      title: 'Full Stack Developer',
      organization: 'StartupXYZ',
      location: 'New York, NY',
      employment_type: ['FULL_TIME'],
      remote: false,
      description: 'Join our fast-growing startup as a full stack developer...',
      skills: ['Python', 'Django', 'React', 'PostgreSQL'],
      salary_min: 90000,
      salary_max: 130000,
      salary_currency: 'USD'
    }
  ];

  for (const job of jobs) {
    await client.query(
      `INSERT INTO jobs (external_id, title, organization, location, employment_type, remote, description, skills, salary_min, salary_max, salary_currency, date_posted, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '1 day', NOW())
       ON CONFLICT (external_id) DO NOTHING`,
      [
        job.external_id, job.title, job.organization, job.location,
        job.employment_type, job.remote, job.description, job.skills,
        job.salary_min, job.salary_max, job.salary_currency
      ]
    );
  }

  // Insert sample user job matches
  const matches = [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      job_id: (await client.query('SELECT id FROM jobs WHERE external_id = $1', ['job_001'])).rows[0].id,
      match_score: 85.5
    }
  ];

  for (const match of matches) {
    await client.query(
      `INSERT INTO user_job_matches (user_id, job_id, match_score, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, job_id) DO NOTHING`,
      [match.user_id, match.job_id, match.match_score]
    );
  }

  // Insert sample notifications
  const notifications = [
    {
      title: 'Welcome to SkillGraph AI Pro!',
      content: 'Thank you for upgrading to our Pro plan. You now have access to advanced features.',
      type: 'email',
      audience: 'Premium Users',
      recipients_count: 1247,
      status: 'sent',
      sent_at: '2024-03-20T10:00:00Z'
    }
  ];

  for (const notification of notifications) {
    await client.query(
      `INSERT INTO notifications (title, content, type, audience, recipients_count, status, sent_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        notification.title, notification.content, notification.type,
        notification.audience, notification.recipients_count,
        notification.status, notification.sent_at
      ]
    );
  }

  // Insert sample CMS articles
  const articles = [
    {
      title: 'Getting Started with Upstar',
      slug: 'getting-started',
      content: 'Welcome to Upstar! This guide will help you get started with our platform...',
      status: 'published',
      category: 'Getting Started',
      author: 'Admin User'
    },
    {
      title: 'How to Optimize Your Resume',
      slug: 'optimize-resume',
      content: 'Learn how to optimize your resume for better job matching...',
      status: 'published',
      category: 'Tips & Tricks',
      author: 'Admin User'
    }
  ];

  for (const article of articles) {
    await client.query(
      `INSERT INTO cms_articles (title, slug, content, status, category, author, published_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '1 week', NOW())`,
      [article.title, article.slug, article.content, article.status, article.category, article.author]
    );
  }

  // Insert sample system metrics
  const metrics = [
    { cpu_usage: 45.2, memory_usage: 67.8, disk_usage: 23.1, network_throughput: 125.5, network_latency: 12.3 },
    { cpu_usage: 42.1, memory_usage: 65.2, disk_usage: 23.5, network_throughput: 118.7, network_latency: 11.8 },
    { cpu_usage: 48.7, memory_usage: 69.1, disk_usage: 24.2, network_throughput: 132.1, network_latency: 13.2 }
  ];

  for (const metric of metrics) {
    await client.query(
      `INSERT INTO system_metrics (cpu_usage, memory_usage, disk_usage, network_throughput, network_latency, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours')`,
      [metric.cpu_usage, metric.memory_usage, metric.disk_usage, metric.network_throughput, metric.network_latency]
    );
  }

  // Insert sample API logs
  const endpoints = ['/api/users', '/api/resumes', '/api/jobs', '/api/analytics', '/api/dashboard'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const statusCodes = [200, 201, 400, 401, 403, 404, 500];

  for (let i = 0; i < 100; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const responseTime = Math.floor(Math.random() * 2000) + 100;

    await client.query(
      `INSERT INTO api_logs (endpoint, method, response_time, status_code, created_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 168)} hours')`,
      [endpoint, method, responseTime, statusCode]
    );
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };