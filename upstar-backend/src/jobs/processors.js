const Bull = require('bull');
const Redis = require('redis');
const { query } = require('../config/database');
const AIService = require('../services/AIService');
const S3Service = require('../services/S3Service');
const EmailService = require('../services/EmailService');
const { logger } = require('../middleware/errorHandler');

// Redis connection
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Job queues
const resumeProcessingQueue = new Bull('resume-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

const jobMatchingQueue = new Bull('job-matching', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

const emailQueue = new Bull('email-notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

const dataSyncQueue = new Bull('data-sync', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

const analyticsQueue = new Bull('analytics', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

// Resume processing job
resumeProcessingQueue.process('extract-skills', async (job) => {
  const { resumeId } = job.data;
  
  try {
    logger.info(`Processing resume: ${resumeId}`);
    
    // Update job progress
    await job.progress(10);
    
    // Get resume data
    const resumeResult = await query(
      'SELECT * FROM resumes WHERE id = $1',
      [resumeId]
    );
    
    if (resumeResult.rows.length === 0) {
      throw new Error('Resume not found');
    }
    
    const resume = resumeResult.rows[0];
    await job.progress(20);
    
    // Download resume file from S3
    const fileData = await S3Service.downloadFile(resume.file_path);
    await job.progress(30);
    
    // Extract text from resume (simplified - in real implementation, use proper PDF parsing)
    const resumeText = fileData.data.toString('utf8');
    await job.progress(40);
    
    // Use AI to extract skills
    const extractedData = await AIService.extractSkillsFromResume(resumeText);
    await job.progress(70);
    
    // Update resume with extracted data
    await query(
      `UPDATE resumes 
       SET processing_status = $1, 
           extracted_text = $2, 
           structured_data = $3, 
           processed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4`,
      ['COMPLETED', resumeText, JSON.stringify(extractedData), resumeId]
    );
    
    await job.progress(90);
    
    // Update user skills
    if (extractedData.skills && extractedData.skills.length > 0) {
      await updateUserSkills(resume.user_id, extractedData.skills);
    }
    
    await job.progress(100);
    
    logger.info(`Resume processing completed: ${resumeId}`);
    
    return {
      success: true,
      resumeId: resumeId,
      extractedSkills: extractedData.skills.length,
      processingTime: Date.now() - job.timestamp
    };
    
  } catch (error) {
    logger.error(`Resume processing failed: ${resumeId}`, error);
    
    // Update resume status to failed
    await query(
      `UPDATE resumes 
       SET processing_status = $1, 
           error_message = $2, 
           updated_at = NOW()
       WHERE id = $3`,
      ['FAILED', error.message, resumeId]
    );
    
    // Log error
    await query(
      `INSERT INTO resume_processing_errors (resume_id, user_id, error_message, error_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [resumeId, job.data.userId, error.message, 'AI_PROCESSING_ERROR']
    );
    
    throw error;
  }
});

// Job matching job
jobMatchingQueue.process('match-user-jobs', async (job) => {
  const { userId, resumeId } = job.data;
  
  try {
    logger.info(`Matching jobs for user: ${userId}`);
    
    await job.progress(10);
    
    // Get user skills
    const userSkillsResult = await query(
      `SELECT s.name FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1`,
      [userId]
    );
    
    const userSkills = userSkillsResult.rows.map(row => row.name);
    await job.progress(30);
    
    // Get available jobs
    const jobsResult = await query(
      'SELECT * FROM jobs WHERE date_posted > NOW() - INTERVAL \'30 days\''
    );
    
    const jobs = jobsResult.rows;
    await job.progress(50);
    
    // Match jobs using AI
    const matches = [];
    for (const jobData of jobs) {
      if (jobData.skills && jobData.skills.length > 0) {
        const matchResult = await AIService.matchUserWithJobs(userSkills, jobData.skills);
        
        if (matchResult.matchScore >= 50) {
          matches.push({
            jobId: jobData.id,
            matchScore: matchResult.matchScore,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills
          });
        }
      }
    }
    
    await job.progress(80);
    
    // Store matches in database
    for (const match of matches) {
      await query(
        `INSERT INTO user_job_matches (user_id, job_id, match_score, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, job_id) DO UPDATE SET
         match_score = $3, updated_at = NOW()`,
        [userId, match.jobId, match.matchScore]
      );
    }
    
    await job.progress(100);
    
    logger.info(`Job matching completed for user: ${userId}, found ${matches.length} matches`);
    
    return {
      success: true,
      userId: userId,
      matchesFound: matches.length,
      processingTime: Date.now() - job.timestamp
    };
    
  } catch (error) {
    logger.error(`Job matching failed for user: ${userId}`, error);
    throw error;
  }
});

// Email notification job
emailQueue.process('send-notification', async (job) => {
  const { notificationId, recipients } = job.data;
  
  try {
    logger.info(`Sending notification: ${notificationId}`);
    
    await job.progress(10);
    
    // Get notification details
    const notificationResult = await query(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );
    
    if (notificationResult.rows.length === 0) {
      throw new Error('Notification not found');
    }
    
    const notification = notificationResult.rows[0];
    await job.progress(20);
    
    // Send emails
    const results = await EmailService.sendBulkNotification(
      recipients,
      notification.title,
      notification.content
    );
    
    await job.progress(80);
    
    // Update notification status
    await query(
      `UPDATE notifications 
       SET status = $1, 
           sent_at = NOW(), 
           recipients_count = $2,
           updated_at = NOW()
       WHERE id = $3`,
      ['sent', results.successful, notificationId]
    );
    
    // Log recipients
    for (const recipient of recipients) {
      await query(
        `INSERT INTO notification_recipients (notification_id, user_id, email, status, sent_at, created_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [notificationId, recipient.id, recipient.email, 'sent']
      );
    }
    
    await job.progress(100);
    
    logger.info(`Notification sent: ${notificationId}, ${results.successful} successful`);
    
    return {
      success: true,
      notificationId: notificationId,
      sent: results.successful,
      failed: results.failed
    };
    
  } catch (error) {
    logger.error(`Email notification failed: ${notificationId}`, error);
    throw error;
  }
});

// Data sync job
dataSyncQueue.process('sync-jobs', async (job) => {
  const { source } = job.data;
  
  try {
    logger.info(`Syncing jobs from: ${source}`);
    
    await job.progress(10);
    
    // Simulate job data sync (in real implementation, this would fetch from external APIs)
    const mockJobs = [
      {
        external_id: `job_${Date.now()}_1`,
        title: 'Senior Software Engineer',
        organization: 'Tech Corp',
        location: 'San Francisco, CA',
        skills: ['JavaScript', 'React', 'Node.js'],
        description: 'Great opportunity for a senior engineer...'
      },
      {
        external_id: `job_${Date.now()}_2`,
        title: 'Data Scientist',
        organization: 'Data Corp',
        location: 'New York, NY',
        skills: ['Python', 'Machine Learning', 'SQL'],
        description: 'Looking for a talented data scientist...'
      }
    ];
    
    await job.progress(30);
    
    // Insert/update jobs
    for (const jobData of mockJobs) {
      await query(
        `INSERT INTO jobs (external_id, title, organization, location, skills, description, date_posted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
         ON CONFLICT (external_id) DO UPDATE SET
         title = $2, organization = $3, location = $4, skills = $5, description = $6, updated_at = NOW()`,
        [jobData.external_id, jobData.title, jobData.organization, jobData.location, jobData.skills, jobData.description]
      );
    }
    
    await job.progress(100);
    
    logger.info(`Job sync completed from: ${source}, synced ${mockJobs.length} jobs`);
    
    return {
      success: true,
      source: source,
      jobsSynced: mockJobs.length,
      processingTime: Date.now() - job.timestamp
    };
    
  } catch (error) {
    logger.error(`Job sync failed from: ${source}`, error);
    throw error;
  }
});

// Analytics job
analyticsQueue.process('generate-report', async (job) => {
  const { reportType, dateRange } = job.data;
  
  try {
    logger.info(`Generating analytics report: ${reportType}`);
    
    await job.progress(10);
    
    let reportData = {};
    
    switch (reportType) {
      case 'user-growth':
        reportData = await generateUserGrowthReport(dateRange);
        break;
      case 'skill-trends':
        reportData = await generateSkillTrendsReport(dateRange);
        break;
      case 'job-performance':
        reportData = await generateJobPerformanceReport(dateRange);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
    
    await job.progress(80);
    
    // Store report in database
    await query(
      `INSERT INTO analytics_reports (report_type, date_range, data, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [reportType, JSON.stringify(dateRange), JSON.stringify(reportData)]
    );
    
    await job.progress(100);
    
    logger.info(`Analytics report generated: ${reportType}`);
    
    return {
      success: true,
      reportType: reportType,
      dataPoints: Object.keys(reportData).length,
      processingTime: Date.now() - job.timestamp
    };
    
  } catch (error) {
    logger.error(`Analytics report generation failed: ${reportType}`, error);
    throw error;
  }
});

// Helper function to update user skills
async function updateUserSkills(userId, skills) {
  for (const skillName of skills) {
    // Get or create skill
    let skillResult = await query('SELECT id FROM skills WHERE name = $1', [skillName]);
    
    if (skillResult.rows.length === 0) {
      const newSkillResult = await query(
        'INSERT INTO skills (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
        [skillName]
      );
      skillResult = newSkillResult;
    }
    
    const skillId = skillResult.rows[0].id;
    
    // Add user skill association
    await query(
      `INSERT INTO user_skills (user_id, skill_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (user_id, skill_id) DO NOTHING`,
      [userId, skillId]
    );
  }
}

// Helper function to generate user growth report
async function generateUserGrowthReport(dateRange) {
  const result = await query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as new_users
     FROM users 
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [dateRange.start, dateRange.end]
  );
  
  return {
    type: 'user-growth',
    data: result.rows,
    totalUsers: result.rows.reduce((sum, row) => sum + parseInt(row.new_users), 0)
  };
}

// Helper function to generate skill trends report
async function generateSkillTrendsReport(dateRange) {
  const result = await query(
    `SELECT 
       s.name,
       COUNT(us.user_id) as user_count,
       AVG(us.experience_years) as avg_experience
     FROM skills s
     LEFT JOIN user_skills us ON s.id = us.skill_id
     WHERE us.created_at BETWEEN $1 AND $2
     GROUP BY s.id, s.name
     ORDER BY user_count DESC
     LIMIT 20`,
    [dateRange.start, dateRange.end]
  );
  
  return {
    type: 'skill-trends',
    data: result.rows,
    topSkills: result.rows.slice(0, 10)
  };
}

// Helper function to generate job performance report
async function generateJobPerformanceReport(dateRange) {
  const result = await query(
    `SELECT 
       COUNT(*) as total_matches,
       AVG(match_score) as avg_match_score,
       COUNT(CASE WHEN applied = true THEN 1 END) as applications,
       COUNT(CASE WHEN viewed = true THEN 1 END) as views
     FROM user_job_matches
     WHERE created_at BETWEEN $1 AND $2`,
    [dateRange.start, dateRange.end]
  );
  
  return {
    type: 'job-performance',
    data: result.rows[0],
    metrics: {
      totalMatches: parseInt(result.rows[0].total_matches),
      avgMatchScore: parseFloat(result.rows[0].avg_match_score),
      applications: parseInt(result.rows[0].applications),
      views: parseInt(result.rows[0].views)
    }
  };
}

// Error handling for all queues
[resumeProcessingQueue, jobMatchingQueue, emailQueue, dataSyncQueue, analyticsQueue].forEach(queue => {
  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
  });
  
  queue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed:`, result);
  });
});

module.exports = {
  resumeProcessingQueue,
  jobMatchingQueue,
  emailQueue,
  dataSyncQueue,
  analyticsQueue
};