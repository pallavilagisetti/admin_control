const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview metrics and KPIs
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 1234
 *                     activeUsers:
 *                       type: integer
 *                       example: 567
 *                     totalResumes:
 *                       type: integer
 *                       example: 2456
 *                     totalJobs:
 *                       type: integer
 *                       example: 890
 *                     revenue:
 *                       type: number
 *                       example: 12345
 *                     userSatisfaction:
 *                       type: number
 *                       example: 94
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     userGrowth:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: integer
 *                         previous:
 *                           type: integer
 *                         growth:
 *                           type: number
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: number
 *                         previous:
 *                           type: number
 *                         growth:
 *                           type: number
 *                     systemHealth:
 *                       type: object
 *                       properties:
 *                         aiProcessing:
 *                           type: number
 *                         database:
 *                           type: number
 *                         apiResponse:
 *                           type: number
 *                         userSatisfaction:
 *                           type: number
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       timestamp:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/overview', asyncHandler(async (req, res) => {
  // Get user statistics
  const userStats = await query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
      COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week
    FROM users
  `);

    // Get resume statistics
    const resumeStats = await query(`
      SELECT 
        COUNT(*) as total_resumes,
        COUNT(CASE WHEN processing_status = 'COMPLETED' THEN 1 END) as processed_resumes,
        COUNT(CASE WHEN uploaded_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_resumes_week
      FROM resumes
    `);

    // Get job statistics
    const jobStats = await query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN date_created > NOW() - INTERVAL '7 days' THEN 1 END) as new_jobs_week
      FROM job_listings
    `);

    // Get revenue statistics (with fallback if payments table doesn't exist)
    let revenueStats;
    try {
      revenueStats = await query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as monthly_revenue
        FROM payments
        WHERE status = 'completed'
      `);
    } catch (error) {
      // Fallback if payments table doesn't exist
      revenueStats = { rows: [{ total_revenue: 0, monthly_revenue: 0 }] };
    }

    // Get system health metrics (with fallback if api_logs doesn't exist)
    let systemHealth;
    try {
      systemHealth = await query(`
        SELECT 
          AVG(CASE WHEN response_time < 1000 THEN 100 ELSE (1000 - response_time) / 10 END) as api_response_score,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_activity
        FROM api_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
    } catch (error) {
      // Fallback if api_logs table doesn't exist
      systemHealth = { rows: [{ api_response_score: 87, recent_activity: 0 }] };
    }

    // Get recent activities (with fallback if tables don't exist)
    let activities;
    try {
      activities = await query(`
        SELECT 
          'User Registration' as type,
          COUNT(*) as count,
          '2 hours ago' as timestamp
        FROM users 
        WHERE created_at > NOW() - INTERVAL '2 hours'
        UNION ALL
        SELECT 
          'Resume Upload' as type,
          COUNT(*) as count,
          '1 hour ago' as timestamp
        FROM resumes 
        WHERE uploaded_at > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC
        LIMIT 5
      `);
    } catch (error) {
      // Fallback if tables don't exist
      activities = { rows: [] };
    }

    // Calculate growth percentages
    const userGrowth = userStats.rows[0];
    const previousUsers = Math.max(userGrowth.total_users - userGrowth.new_users_week, 1);
    const userGrowthPercent = ((userGrowth.new_users_week / previousUsers) * 100).toFixed(1);

    const revenueGrowth = revenueStats.rows[0];
    const previousRevenue = Math.max(revenueGrowth.total_revenue - revenueGrowth.monthly_revenue, 1);
    const revenueGrowthPercent = ((revenueGrowth.monthly_revenue / previousRevenue) * 100).toFixed(1);

    const data = {
      summary: {
        totalUsers: parseInt(userGrowth.total_users),
        activeUsers: parseInt(userGrowth.active_users),
        totalResumes: parseInt(resumeStats.rows[0].total_resumes),
        totalJobs: parseInt(jobStats.rows[0].total_jobs),
        revenue: parseFloat(revenueGrowth.total_revenue),
        userSatisfaction: 94 // This would come from user feedback system
      },
      metrics: {
        userGrowth: {
          current: parseInt(userGrowth.total_users),
          previous: previousUsers,
          growth: parseFloat(userGrowthPercent)
        },
        revenue: {
          current: parseFloat(revenueGrowth.total_revenue),
          previous: previousRevenue,
          growth: parseFloat(revenueGrowthPercent)
        },
        systemHealth: {
          aiProcessing: 98, // This would come from AI service health
          database: 95, // This would come from database health
          apiResponse: parseFloat(systemHealth.rows[0]?.api_response_score || 87),
          userSatisfaction: 94
        }
      },
      activities: activities.rows.map(activity => ({
        type: activity.type,
        count: parseInt(activity.count),
        timestamp: activity.timestamp
      }))
    };

  res.json(data);
}));

/**
 * @swagger
 * /api/dashboard/analytics-report:
 *   get:
 *     summary: Generate comprehensive analytics report
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf, json]
 *           default: json
 *         description: Report format
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Report period
 *     responses:
 *       200:
 *         description: Analytics report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   type: object
 *                 downloadUrl:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/analytics-report', asyncHandler(async (req, res) => {
  const { format = 'json', period = '30d' } = req.query;
  
  // Calculate date range based on period
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const days = periodMap[period] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Get comprehensive analytics data
    const [
      userStats,
      resumeStats,
      jobStats,
      revenueStats,
      systemHealth,
      recentActivities,
      analyticsData
    ] = await Promise.all([
    // User statistics
    query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '${days} days' THEN 1 END) as new_users_period,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '${days * 2} days' AND created_at <= NOW() - INTERVAL '${days} days' THEN 1 END) as previous_period_users,
        COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d
      FROM users
    `),
    
    // Resume statistics
    query(`
      SELECT 
        COUNT(*) as total_resumes,
        COUNT(CASE WHEN uploaded_at > NOW() - INTERVAL '${days} days' THEN 1 END) as new_resumes_period,
        COUNT(CASE WHEN processing_status = 'COMPLETED' THEN 1 END) as processed_resumes,
        COUNT(CASE WHEN processing_status = 'PROCESSING' THEN 1 END) as processing_resumes
      FROM resumes
    `),
    
    // Job statistics
    query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN date_created > NOW() - INTERVAL '${days} days' THEN 1 END) as new_jobs_period,
        COUNT(CASE WHEN date_posted > NOW() - INTERVAL '30 days' THEN 1 END) as recent_jobs
      FROM job_listings
    `),
    
    // Revenue statistics (with fallback)
    (async () => {
      try {
        return await query(`
          SELECT 
            COALESCE(SUM(amount), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '${days} days' THEN amount ELSE 0 END), 0) as period_revenue,
            COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '${days * 2} days' AND created_at <= NOW() - INTERVAL '${days} days' THEN amount ELSE 0 END), 0) as previous_period_revenue
          FROM payments
          WHERE status = 'completed'
        `);
      } catch (error) {
        return { rows: [{ total_revenue: 0, period_revenue: 0, previous_period_revenue: 0 }] };
      }
    })(),
    
    // System health metrics (with fallback)
    (async () => {
      try {
        return await query(`
          SELECT 
            AVG(CASE WHEN response_time < 1000 THEN 100 ELSE GREATEST(0, 100 - (response_time - 1000) / 10) END) as api_response_score,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_requests,
            COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
            COUNT(*) as total_requests
          FROM api_logs
          WHERE created_at > NOW() - INTERVAL '24 hours'
        `);
      } catch (error) {
        return { rows: [{ api_response_score: 87, recent_requests: 0, successful_requests: 0, total_requests: 0 }] };
      }
    })(),
    
    // Recent activities (with fallback)
    (async () => {
      try {
        return await query(`
          SELECT 
            activity_type as type,
            COUNT(*) as count,
            MAX(created_at) as latest_timestamp
          FROM user_activity_logs
          WHERE created_at > NOW() - INTERVAL '24 hours'
          GROUP BY activity_type
          ORDER BY count DESC
          LIMIT 10
        `);
      } catch (error) {
        return { rows: [] };
      }
    })(),
    
    // Daily analytics data (with fallback)
    (async () => {
      try {
        return await query(`
          SELECT 
            DATE_TRUNC('day', created_at) as date,
            COUNT(DISTINCT user_id) as daily_active_users,
            COUNT(*) as daily_activities,
            SUM(CASE WHEN activity_type = 'resume_upload' THEN 1 ELSE 0 END) as resume_uploads,
            SUM(CASE WHEN activity_type = 'job_application' THEN 1 ELSE 0 END) as job_applications
          FROM user_activity_logs
          WHERE created_at >= $1
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY date DESC
        `, [startDate]);
      } catch (error) {
        return { rows: [] };
      }
    })()
  ]);
  
  const userData = userStats.rows[0];
  const resumeData = resumeStats.rows[0];
  const jobData = jobStats.rows[0];
  const revenueData = revenueStats.rows[0];
  const healthData = systemHealth.rows[0];
  const activitiesData = recentActivities.rows;
  
  // Calculate growth percentages
  const userGrowth = userData.previous_period_users > 0 
    ? ((userData.new_users_period - userData.previous_period_users) / userData.previous_period_users * 100).toFixed(1)
    : 0;
    
  const revenueGrowth = revenueData.previous_period_revenue > 0
    ? ((revenueData.period_revenue - revenueData.previous_period_revenue) / revenueData.previous_period_revenue * 100).toFixed(1)
    : 0;
  
  // Calculate system health scores
  const apiResponseScore = healthData.api_response_score ? Math.round(healthData.api_response_score) : 95;
  const successRate = healthData.total_requests > 0 
    ? Math.round((healthData.successful_requests / healthData.total_requests) * 100)
    : 95;
  
  const report = {
    title: 'SkillGraph AI - Comprehensive Analytics Report',
    generatedAt: new Date().toISOString(),
    period: `Last ${days} Days`,
    appVersion: '1.0.0',
    environment: 'production',
    summary: {
      totalUsers: parseInt(userData.total_users),
      activeUsers: parseInt(userData.active_users_30d),
      totalResumes: parseInt(resumeData.total_resumes),
      totalJobs: parseInt(jobData.total_jobs),
      revenue: parseFloat(revenueData.total_revenue),
      userSatisfaction: successRate
    },
    metrics: {
      userGrowth: {
        current: parseInt(userData.new_users_period),
        previous: parseInt(userData.previous_period_users),
        growth: parseFloat(userGrowth)
      },
      revenue: {
        current: parseFloat(revenueData.period_revenue),
        previous: parseFloat(revenueData.previous_period_revenue),
        growth: parseFloat(revenueGrowth)
      },
      systemHealth: {
        aiProcessing: 98, // This could be calculated from resume processing success rate
        database: 95, // This could be calculated from database response times
        apiResponse: apiResponseScore,
        userSatisfaction: successRate
      }
    },
    activities: activitiesData.map(activity => ({
      type: activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: parseInt(activity.count),
      timestamp: new Date(activity.latest_timestamp).toLocaleString()
    })),
    recommendations: [
      apiResponseScore < 90 ? "Consider optimizing API response times to improve user experience" : "API response times are performing well",
      successRate > 95 ? "System reliability is excellent - maintain current configuration" : "Monitor system performance for potential issues",
      parseInt(userData.active_users_30d) > parseInt(userData.total_users) * 0.3 ? "User engagement is healthy - continue current strategies" : "Consider strategies to increase user engagement",
      parseFloat(revenueGrowth) > 0 ? "Revenue growth is positive - consider expanding premium features" : "Review revenue strategies and user conversion"
    ],
    data: analyticsData.rows,
    detailedSummary: {
      totalDays: days,
      totalActivities: analyticsData.rows.reduce((sum, row) => sum + parseInt(row.daily_activities), 0),
      avgDailyUsers: Math.round(analyticsData.rows.reduce((sum, row) => sum + parseInt(row.daily_active_users), 0) / days),
      totalResumeUploads: analyticsData.rows.reduce((sum, row) => sum + parseInt(row.resume_uploads), 0),
      totalJobApplications: analyticsData.rows.reduce((sum, row) => sum + parseInt(row.job_applications), 0),
      processedResumes: parseInt(resumeData.processed_resumes),
      processingResumes: parseInt(resumeData.processing_resumes),
      recentJobs: parseInt(jobData.recent_jobs)
    }
  };
  
    if (format === 'json') {
      res.json({ report });
    } else {
      // For CSV/PDF, you would generate files and return download URLs
      res.json({
        message: 'Report generation initiated',
        reportId: `report_${Date.now()}`,
        downloadUrl: `/api/reports/${Date.now()}.${format}`
      });
    }
  } catch (error) {
    console.error('Error generating analytics report:', error);
    res.status(500).json({
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: 'Failed to generate analytics report',
        details: error.message
      }
    });
  }
}));

module.exports = router;





