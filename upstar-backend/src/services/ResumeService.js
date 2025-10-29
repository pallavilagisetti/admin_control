const { query, cache } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ResumeService {
  // Process resume with AI (synchronous mock without Bull)
  static async processResume(resumeId) {
    try {
      await query(
        'UPDATE resumes SET processing_status = $1, updated_at = NOW() WHERE id = $2',
        ['PROCESSING', resumeId]
      );

      // Simulate processing work
      await new Promise(resolve => setTimeout(resolve, 1000));

      await query(
        'UPDATE resumes SET processing_status = $1, processed_at = NOW(), updated_at = NOW() WHERE id = $2',
        ['COMPLETED', resumeId]
      );

      return {
        success: true,
        message: 'Resume processed successfully'
      };
    } catch (error) {
      await query(
        `UPDATE resumes 
         SET processing_status = $1, 
             error_message = $2, 
             updated_at = NOW()
         WHERE id = $3`,
        ['FAILED', error.message, resumeId]
      );

      throw error;
    }
  }

  // Extract skills from resume text using AI
  static async extractSkills(resumeText) {
    const mockSkills = [
      'JavaScript', 'React', 'Node.js', 'Python', 'SQL',
      'AWS', 'Docker', 'Git', 'HTML', 'CSS'
    ];

    await new Promise(resolve => setTimeout(resolve, 2000));

    const extractedData = {
      skills: mockSkills.slice(0, Math.floor(Math.random() * 5) + 3),
      education: 'Bachelor of Computer Science',
      experience: `${Math.floor(Math.random() * 10) + 1} years of software development experience`,
      summary: 'Experienced software developer with expertise in modern web technologies',
      certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
      languages: ['English', 'Spanish'],
      location: 'San Francisco, CA'
    };

    return extractedData;
  }

  // Match user skills with job requirements
  static async matchUserWithJobs(userId, userSkills) {
    try {
      const jobsQuery = `
        SELECT j.id, j.title, j.organization, j.skills, j.location
        FROM jobs j
        WHERE j.skills && $1
        ORDER BY j.date_posted DESC
        LIMIT 20
      `;

      const result = await query(jobsQuery, [userSkills]);

      const matches = result.rows.map(job => {
        const jobSkills = job.skills || [];
        const commonSkills = userSkills.filter(skill => jobSkills.includes(skill));
        const matchScore = (commonSkills.length / Math.max(userSkills.length, jobSkills.length)) * 100;

        return {
          jobId: job.id,
          title: job.title,
          organization: job.organization,
          location: job.location,
          matchScore: Math.round(matchScore * 100) / 100,
          commonSkills: commonSkills
        };
      });

      const validMatches = matches.filter(match => match.matchScore >= 50);

      for (const match of validMatches) {
        await query(
          `INSERT INTO user_job_matches (user_id, job_id, match_score, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, job_id) DO UPDATE SET
           match_score = $3, updated_at = NOW()`,
          [userId, match.jobId, match.matchScore]
        );
      }

      return {
        success: true,
        matches: validMatches.length,
        topMatches: validMatches.slice(0, 5)
      };
    } catch (error) {
      throw error;
    }
  }

  static async getProcessingStatus(resumeId) {
    const result = await query(
      'SELECT processing_status, error_message, processed_at FROM resumes WHERE id = $1',
      [resumeId]
    );

    if (result.rows.length === 0) {
      throw new Error('Resume not found');
    }

    return result.rows[0];
  }

  static async getResumeAnalytics() {
    const cacheKey = 'resume:analytics';
    let analytics = await cache.get(cacheKey);

    if (!analytics) {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_resumes,
          COUNT(CASE WHEN processing_status = 'COMPLETED' THEN 1 END) as processed,
          COUNT(CASE WHEN processing_status = 'PROCESSING' THEN 1 END) as processing,
          COUNT(CASE WHEN processing_status = 'FAILED' THEN 1 END) as failed,
          COUNT(CASE WHEN processing_status = 'PENDING' THEN 1 END) as pending,
          AVG(CASE WHEN processed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (processed_at - uploaded_at)) 
          END) as avg_processing_time
        FROM resumes
      `;

      const result = await query(statsQuery);
      const stats = result.rows[0];

      analytics = {
        totalResumes: parseInt(stats.total_resumes),
        processed: parseInt(stats.processed),
        processing: parseInt(stats.processing),
        failed: parseInt(stats.failed),
        pending: parseInt(stats.pending),
        successRate: stats.total_resumes > 0 ? 
          Math.round((stats.processed / stats.total_resumes) * 100) : 0,
        avgProcessingTime: stats.avg_processing_time ? 
          Math.round(stats.avg_processing_time) : 0
      };

      await cache.set(cacheKey, analytics, 900);
    }

    return analytics;
  }

  static async getProcessingErrors(page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const errorsQuery = `
      SELECT 
        rpe.id,
        rpe.resume_id,
        rpe.user_id,
        rpe.error_message,
        rpe.error_type,
        rpe.created_at,
        r.filename,
        u.name as user_name,
        u.email as user_email
      FROM resume_processing_errors rpe
      JOIN resumes r ON rpe.resume_id = r.id
      JOIN users u ON rpe.user_id = u.id
      ORDER BY rpe.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM resume_processing_errors
    `;

    const [errorsResult, countResult] = await Promise.all([
      query(errorsQuery, [limit, offset]),
      query(countQuery)
    ]);

    const errors = errorsResult.rows.map(error => ({
      id: error.id,
      resumeId: error.resume_id,
      userId: error.user_id,
      errorMessage: error.error_message,
      errorType: error.error_type,
      timestamp: error.created_at,
      filename: error.filename,
      user: {
        name: error.user_name,
        email: error.user_email
      }
    }));

    return {
      errors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    };
  }

  static async reprocessResume(resumeId) {
    try {
      const resumeResult = await query('SELECT id, processing_status FROM resumes WHERE id = $1', [resumeId]);
      if (resumeResult.rows.length === 0) {
        throw new Error('Resume not found');
      }

      await query(
        'UPDATE resumes SET processing_status = $1, updated_at = NOW() WHERE id = $2',
        ['PENDING', resumeId]
      );

      // Simulate immediate processing without queue
      return await this.processResume(resumeId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ResumeService;






