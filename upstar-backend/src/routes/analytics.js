const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/skill-analysis:
 *   get:
 *     summary: Get skill gap analysis and trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skill gap analysis data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gaps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       score:
 *                         type: number
 *                       tag:
 *                         type: string
 *                 emerging:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       growth:
 *                         type: string
 *                       requests:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/skill-analysis', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:skill-analysis';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Get skill gaps (high demand, low supply)
    const skillGaps = await query(`
      SELECT 
        s.name,
        s.market_demand_score as score,
        CASE 
          WHEN s.market_demand_score >= 90 THEN 'Critical'
          WHEN s.market_demand_score >= 80 THEN 'High'
          WHEN s.market_demand_score >= 70 THEN 'Medium'
          ELSE 'Low'
        END as tag
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      WHERE s.market_demand_score > 70
      GROUP BY s.id, s.name, s.market_demand_score
      HAVING COUNT(us.user_id) < 100
      ORDER BY s.market_demand_score DESC
      LIMIT 20
    `);

    // Get emerging skills (high growth rate)
    const emergingSkills = await query(`
      SELECT 
        s.name,
        s.growth_rate,
        COUNT(us.user_id) as requests
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      WHERE s.growth_rate > 20
      GROUP BY s.id, s.name, s.growth_rate
      ORDER BY s.growth_rate DESC
      LIMIT 15
    `);

    data = {
      gaps: skillGaps.rows.map(gap => ({
        name: gap.name,
        score: parseFloat(gap.score),
        tag: gap.tag
      })),
      emerging: emergingSkills.rows.map(skill => ({
        name: skill.name,
        growth: `+${skill.growth_rate}%`,
        requests: parseInt(skill.requests)
      }))
    };

    // Cache for 30 minutes
    await cache.set(cacheKey, data, 1800);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/analytics/market-trends:
 *   get:
 *     summary: Get market trends and demand data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Market trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       skill:
 *                         type: string
 *                       demand:
 *                         type: number
 *                       growth:
 *                         type: string
 *                       salary:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/market-trends', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:market-trends';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const marketTrends = await query(`
      SELECT 
        s.name as skill,
        s.market_demand_score as demand,
        s.growth_rate,
        s.avg_salary
      FROM skills s
      WHERE s.market_demand_score > 80
      ORDER BY s.market_demand_score DESC
      LIMIT 20
    `);

    data = {
      trends: marketTrends.rows.map(trend => ({
        skill: trend.skill,
        demand: parseFloat(trend.demand),
        growth: `+${trend.growth_rate}%`,
        salary: `$${Math.round(trend.avg_salary / 1000)}k`
      }))
    };

    // Cache for 1 hour
    await cache.set(cacheKey, data, 3600);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/analytics/job-performance:
 *   get:
 *     summary: Get job recommendation performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clickThroughRate:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     change:
 *                       type: string
 *                     positive:
 *                       type: boolean
 *                 applicationRate:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     change:
 *                       type: string
 *                     positive:
 *                       type: boolean
 *                 interviewSuccess:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     change:
 *                       type: string
 *                     positive:
 *                       type: boolean
 *                 jobMatchAccuracy:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     change:
 *                       type: string
 *                     positive:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/job-performance', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:job-performance';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Get job performance metrics
    const performanceMetrics = await query(`
      SELECT 
        AVG(click_through_rate) as ctr,
        AVG(application_rate) as app_rate,
        AVG(interview_success_rate) as interview_rate,
        AVG(match_accuracy) as match_accuracy,
        AVG(click_through_rate_change) as ctr_change,
        AVG(application_rate_change) as app_rate_change,
        AVG(interview_success_rate_change) as interview_rate_change,
        AVG(match_accuracy_change) as match_accuracy_change
      FROM job_performance_metrics
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    const metrics = performanceMetrics.rows[0];
    data = {
      clickThroughRate: {
        value: `${(metrics.ctr * 100).toFixed(1)}%`,
        change: `${metrics.ctr_change > 0 ? '+' : ''}${(metrics.ctr_change * 100).toFixed(1)}%`,
        positive: metrics.ctr_change > 0
      },
      applicationRate: {
        value: `${(metrics.app_rate * 100).toFixed(1)}%`,
        change: `${metrics.app_rate_change > 0 ? '+' : ''}${(metrics.app_rate_change * 100).toFixed(1)}%`,
        positive: metrics.app_rate_change > 0
      },
      interviewSuccess: {
        value: `${(metrics.interview_rate * 100).toFixed(1)}%`,
        change: `${metrics.interview_rate_change > 0 ? '+' : ''}${(metrics.interview_rate_change * 100).toFixed(1)}%`,
        positive: metrics.interview_rate_change > 0
      },
      jobMatchAccuracy: {
        value: `${(metrics.match_accuracy * 100).toFixed(1)}%`,
        change: `${metrics.match_accuracy_change > 0 ? '+' : ''}${(metrics.match_accuracy_change * 100).toFixed(1)}%`,
        positive: metrics.match_accuracy_change > 0
      }
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, data, 900);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/analytics/geographic:
 *   get:
 *     summary: Get geographic distribution data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Geographic distribution data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 regions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       region:
 *                         type: string
 *                       users:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/geographic', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:geographic';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const geographicData = await query(`
      SELECT 
        CASE 
          WHEN country IN ('US', 'CA', 'MX') THEN 'North America'
          WHEN country IN ('GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI') THEN 'Europe'
          WHEN country IN ('AU', 'NZ') THEN 'Oceania'
          WHEN country IN ('JP', 'KR', 'CN', 'IN', 'SG', 'HK') THEN 'Asia'
          ELSE 'Other'
        END as region,
        COUNT(*) as users,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM users
      WHERE country IS NOT NULL
      GROUP BY 
        CASE 
          WHEN country IN ('US', 'CA', 'MX') THEN 'North America'
          WHEN country IN ('GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI') THEN 'Europe'
          WHEN country IN ('AU', 'NZ') THEN 'Oceania'
          WHEN country IN ('JP', 'KR', 'CN', 'IN', 'SG', 'HK') THEN 'Asia'
          ELSE 'Other'
        END
      ORDER BY users DESC
    `);

    data = {
      regions: geographicData.rows.map(region => ({
        region: region.region,
        users: parseInt(region.users),
        percentage: parseFloat(region.percentage)
      }))
    };

    // Cache for 1 hour
    await cache.set(cacheKey, data, 3600);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/analytics/user-engagement:
 *   get:
 *     summary: Get user engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for engagement metrics
 *     responses:
 *       200:
 *         description: User engagement metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyActiveUsers:
 *                   type: integer
 *                 weeklyActiveUsers:
 *                   type: integer
 *                 monthlyActiveUsers:
 *                   type: integer
 *                 averageSessionDuration:
 *                   type: string
 *                 retentionRate:
 *                   type: number
 *                 engagementScore:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user-engagement', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range based on period
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };
  
  const days = periodMap[period] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const cacheKey = `analytics:user-engagement:${period}`;
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const engagementMetrics = await query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN last_login_at >= CURRENT_DATE THEN user_id END) as daily_active_users,
        COUNT(DISTINCT CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '7 days' THEN user_id END) as weekly_active_users,
        COUNT(DISTINCT CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '30 days' THEN user_id END) as monthly_active_users,
        AVG(session_duration_minutes) as avg_session_duration,
        AVG(retention_rate) as retention_rate,
        AVG(engagement_score) as engagement_score
      FROM user_engagement_metrics
      WHERE created_at >= $1
    `, [startDate]);

    const metrics = engagementMetrics.rows[0];
    data = {
      dailyActiveUsers: parseInt(metrics.daily_active_users || 0),
      weeklyActiveUsers: parseInt(metrics.weekly_active_users || 0),
      monthlyActiveUsers: parseInt(metrics.monthly_active_users || 0),
      averageSessionDuration: `${Math.round(metrics.avg_session_duration || 0)} min`,
      retentionRate: parseFloat(metrics.retention_rate || 0),
      engagementScore: parseFloat(metrics.engagement_score || 0)
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, data, 900);
  }

  res.json(data);
}));

module.exports = router;






