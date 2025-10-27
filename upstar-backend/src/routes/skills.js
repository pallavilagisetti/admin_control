const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/skills/analytics:
 *   get:
 *     summary: Get skills analytics and insights
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     skillsTracked:
 *                       type: integer
 *                     activeUsers:
 *                       type: integer
 *                     marketDemand:
 *                       type: number
 *                     avgGrowth:
 *                       type: number
 *                 topSkills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       skill:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       growth:
 *                         type: string
 *                 topMissing:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       skill:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       gap:
 *                         type: integer
 *                 experienceLevels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *                 skillDevelopmentTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       learners:
 *                         type: integer
 *                       growth:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const cacheKey = 'skills:analytics';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Get skills metrics
    const skillsMetrics = await query(`
      SELECT 
        COUNT(DISTINCT skill_name) as skills_tracked,
        COUNT(DISTINCT user_id) as active_users,
        AVG(market_demand_score) as market_demand,
        AVG(growth_rate) as avg_growth
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.created_at > NOW() - INTERVAL '30 days'
    `);

    // Get top skills
    const topSkills = await query(`
      SELECT 
        s.name as skill,
        COUNT(us.user_id) as count,
        ROUND(AVG(s.growth_rate), 1) as growth
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.created_at > NOW() - INTERVAL '30 days'
      GROUP BY s.id, s.name, s.growth_rate
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get top missing skills (skills with high demand but low user count)
    const topMissing = await query(`
      SELECT 
        s.name as skill,
        COUNT(us.user_id) as count,
        s.market_demand_score as gap
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      WHERE s.market_demand_score > 80
      GROUP BY s.id, s.name, s.market_demand_score
      HAVING COUNT(us.user_id) < 100
      ORDER BY s.market_demand_score DESC
      LIMIT 10
    `);

    // Get experience levels distribution
    const experienceLevels = await query(`
      SELECT 
        CASE 
          WHEN us.experience_years >= 8 THEN 'Expert (8-10 years)'
          WHEN us.experience_years >= 5 THEN 'Senior (5-7 years)'
          WHEN us.experience_years >= 3 THEN 'Mid-level (3-4 years)'
          WHEN us.experience_years >= 1 THEN 'Junior (1-2 years)'
          ELSE 'Entry-level (0-1 years)'
        END as level,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM user_skills us
      WHERE us.created_at > NOW() - INTERVAL '30 days'
      GROUP BY 
        CASE 
          WHEN us.experience_years >= 8 THEN 'Expert (8-10 years)'
          WHEN us.experience_years >= 5 THEN 'Senior (5-7 years)'
          WHEN us.experience_years >= 3 THEN 'Mid-level (3-4 years)'
          WHEN us.experience_years >= 1 THEN 'Junior (1-2 years)'
          ELSE 'Entry-level (0-1 years)'
        END
      ORDER BY count DESC
    `);

    // Get skill development trends by category
    const skillTrends = await query(`
      SELECT 
        s.category,
        COUNT(DISTINCT us.user_id) as learners,
        ROUND(AVG(s.growth_rate), 1) as growth
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.created_at > NOW() - INTERVAL '30 days'
      GROUP BY s.category
      ORDER BY learners DESC
    `);

    const metrics = skillsMetrics.rows[0];
    data = {
      metrics: {
        skillsTracked: parseInt(metrics.skills_tracked),
        activeUsers: parseInt(metrics.active_users),
        marketDemand: parseFloat(metrics.market_demand || 0),
        avgGrowth: parseFloat(metrics.avg_growth || 0)
      },
      topSkills: topSkills.rows.map(skill => ({
        skill: skill.skill,
        count: parseInt(skill.count),
        growth: `+${skill.growth}%`
      })),
      topMissing: topMissing.rows.map(skill => ({
        skill: skill.skill,
        count: parseInt(skill.count),
        gap: parseInt(skill.gap)
      })),
      experienceLevels: experienceLevels.rows.map(level => ({
        level: level.level,
        count: parseInt(level.count),
        percentage: parseFloat(level.percentage)
      })),
      skillDevelopmentTrends: skillTrends.rows.map(trend => ({
        category: trend.category,
        learners: parseInt(trend.learners),
        growth: `+${trend.growth}%`
      }))
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, data, 900);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/skills/errors:
 *   get:
 *     summary: Get parsing errors and failed extractions
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of parsing errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resumeId:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       error:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/errors', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Get total count of errors
  const countQuery = `
    SELECT COUNT(*) as total
    FROM resume_processing_errors
  `;
  const countResult = await query(countQuery);
  const total = parseInt(countResult.rows[0].total);

  // Get errors with pagination
  const errorsQuery = `
    SELECT 
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

  const errorsResult = await query(errorsQuery, [parseInt(limit), offset]);

  const errors = errorsResult.rows.map(error => ({
    resumeId: error.resume_id,
    userId: error.user_id,
    error: error.error_message,
    errorType: error.error_type,
    timestamp: error.created_at,
    filename: error.filename,
    user: {
      name: error.user_name,
      email: error.user_email
    }
  }));

  res.json({
    errors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * @swagger
 * /api/skills/categories:
 *   get:
 *     summary: Get skills categories and their metrics
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills categories data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       skillsCount:
 *                         type: integer
 *                       usersCount:
 *                         type: integer
 *                       avgDemand:
 *                         type: number
 *                       topSkills:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const cacheKey = 'skills:categories';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const categoriesQuery = `
      SELECT 
        s.category,
        COUNT(DISTINCT s.id) as skills_count,
        COUNT(DISTINCT us.user_id) as users_count,
        ROUND(AVG(s.market_demand_score), 1) as avg_demand,
        ARRAY_AGG(DISTINCT s.name ORDER BY s.market_demand_score DESC) as top_skills
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      GROUP BY s.category
      ORDER BY skills_count DESC
    `;

    const result = await query(categoriesQuery);
    
    data = {
      categories: result.rows.map(category => ({
        name: category.category,
        skillsCount: parseInt(category.skills_count),
        usersCount: parseInt(category.users_count),
        avgDemand: parseFloat(category.avg_demand || 0),
        topSkills: category.top_skills.slice(0, 5) // Top 5 skills in category
      }))
    };

    // Cache for 30 minutes
    await cache.set(cacheKey, data, 1800);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/skills/trends:
 *   get:
 *     summary: Get skills trends over time
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for trends
 *     responses:
 *       200:
 *         description: Skills trends data
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
 *                       growth:
 *                         type: number
 *                       demand:
 *                         type: number
 *                       users:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trends', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
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

  const trendsQuery = `
    SELECT 
      s.name as skill,
      s.growth_rate as growth,
      s.market_demand_score as demand,
      COUNT(us.user_id) as users
    FROM skills s
    LEFT JOIN user_skills us ON s.id = us.skill_id
    WHERE s.updated_at >= $1
    GROUP BY s.id, s.name, s.growth_rate, s.market_demand_score
    ORDER BY s.growth_rate DESC
    LIMIT 20
  `;

  const result = await query(trendsQuery, [startDate]);
  
  const trends = result.rows.map(trend => ({
    skill: trend.skill,
    growth: parseFloat(trend.growth),
    demand: parseFloat(trend.demand),
    users: parseInt(trend.users)
  }));

  res.json({ trends });
}));

module.exports = router;






