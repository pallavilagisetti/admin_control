const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get job listings with filtering
 *     tags: [Jobs]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title/description
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP]
 *         description: Filter by employment type
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *         description: Filter remote jobs
 *       - in: query
 *         name: datePosted
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by posting date
 *     responses:
 *       200:
 *         description: List of jobs with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       organization:
 *                         type: string
 *                       location:
 *                         type: string
 *                       employmentType:
 *                         type: array
 *                         items:
 *                           type: string
 *                       remote:
 *                         type: boolean
 *                       datePosted:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *                       salary:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: integer
 *                           max:
 *                             type: integer
 *                           currency:
 *                             type: string
 *                       skills:
 *                         type: array
 *                         items:
 *                           type: string
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
router.get('/', requirePermission(['jobs:read']), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    location,
    employmentType,
    remote,
    datePosted
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (search) {
    paramCount++;
    whereConditions.push(`(j.title ILIKE $${paramCount} OR j.description ILIKE $${paramCount})`);
    queryParams.push(`%${search}%`);
  }

  if (location) {
    paramCount++;
    whereConditions.push(`j.location ILIKE $${paramCount}`);
    queryParams.push(`%${location}%`);
  }

  if (employmentType) {
    paramCount++;
    whereConditions.push(`$${paramCount} = ANY(j.employment_type)`);
    queryParams.push(employmentType);
  }

  if (remote !== undefined) {
    paramCount++;
    whereConditions.push(`j.remote = $${paramCount}`);
    queryParams.push(remote === 'true');
  }

  if (datePosted) {
    paramCount++;
    whereConditions.push(`DATE(j.date_posted) = $${paramCount}`);
    queryParams.push(datePosted);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM jobs j
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get jobs with pagination
  const jobsQuery = `
    SELECT 
      j.id,
      j.title,
      j.organization,
      j.location,
      j.employment_type,
      j.remote,
      j.date_posted,
      j.description,
      j.salary_min,
      j.salary_max,
      j.salary_currency,
      j.skills,
      j.application_url,
      j.external_id
    FROM jobs j
    ${whereClause}
    ORDER BY j.date_posted DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(parseInt(limit), offset);
  const jobsResult = await query(jobsQuery, queryParams);

  const jobs = jobsResult.rows.map(job => ({
    id: job.external_id || job.id,
    title: job.title,
    organization: job.organization,
    location: job.location,
    employmentType: job.employment_type,
    remote: job.remote,
    datePosted: job.date_posted,
    description: job.description,
    salary: {
      min: job.salary_min,
      max: job.salary_max,
      currency: job.salary_currency
    },
    skills: job.skills || [],
    applicationUrl: job.application_url
  }));

  res.json({
    jobs,
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
 * /api/jobs/{id}:
 *   get:
 *     summary: Get specific job details
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 organization:
 *                   type: string
 *                 description:
 *                   type: string
 *                 requirements:
 *                   type: string
 *                 benefits:
 *                   type: array
 *                   items:
 *                     type: string
 *                 applicationUrl:
 *                   type: string
 *                 matchedUsers:
 *                   type: integer
 *                 matchScore:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', requirePermission(['jobs:read']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Try cache first
  const cacheKey = `job:${id}`;
  let jobData = await cache.get(cacheKey);

  if (!jobData) {
    const jobQuery = `
      SELECT 
        j.id,
        j.external_id,
        j.title,
        j.organization,
        j.description,
        j.requirements,
        j.benefits,
        j.application_url,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.skills,
        j.location,
        j.employment_type,
        j.remote,
        j.date_posted,
        COUNT(ujm.user_id) as matched_users,
        AVG(ujm.match_score) as avg_match_score
      FROM jobs j
      LEFT JOIN user_job_matches ujm ON j.id = ujm.job_id
      WHERE j.id = $1 OR j.external_id = $1
      GROUP BY j.id, j.external_id, j.title, j.organization, j.description, 
               j.requirements, j.benefits, j.application_url, j.salary_min, 
               j.salary_max, j.salary_currency, j.skills, j.location, 
               j.employment_type, j.remote, j.date_posted
    `;

    const result = await query(jobQuery, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Job');
    }

    const job = result.rows[0];
    jobData = {
      id: job.external_id || job.id,
      title: job.title,
      organization: job.organization,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits || [],
      applicationUrl: job.application_url,
      salary: {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.salary_currency
      },
      skills: job.skills || [],
      location: job.location,
      employmentType: job.employment_type,
      remote: job.remote,
      datePosted: job.date_posted,
      matchedUsers: parseInt(job.matched_users),
      matchScore: parseFloat(job.avg_match_score || 0)
    };

    // Cache for 30 minutes
    await cache.set(cacheKey, jobData, 1800);
  }

  res.json(jobData);
}));

/**
 * @swagger
 * /api/jobs/sync:
 *   post:
 *     summary: Trigger job data synchronization
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job sync initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 syncId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/sync', requirePermission(['jobs:write']), asyncHandler(async (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const syncId = uuidv4();

  // In a real implementation, you would queue this job with Bull Queue
  // For now, we'll simulate the job creation
  const jobData = {
    syncId: syncId,
    type: 'JOB_SYNC',
    priority: 'normal',
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  };

  // Log the sync request
  await query(
    'INSERT INTO job_sync_logs (sync_id, status, created_at) VALUES ($1, $2, NOW())',
    [syncId, 'PENDING']
  );

  res.json({
    message: 'Job sync initiated',
    syncId: syncId
  });
}));

/**
 * @swagger
 * /api/jobs/analytics:
 *   get:
 *     summary: Get job analytics and metrics
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalJobs:
 *                   type: integer
 *                 newJobsToday:
 *                   type: integer
 *                 topLocations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       location:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 topSkills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       skill:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 employmentTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       count:
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
router.get('/analytics', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'jobs:analytics';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Get total jobs and new jobs today
    const jobStats = await query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN date_posted >= CURRENT_DATE THEN 1 END) as new_jobs_today
      FROM jobs
    `);

    // Get top locations
    const topLocations = await query(`
      SELECT 
        location,
        COUNT(*) as count
      FROM jobs
      WHERE location IS NOT NULL
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get top skills from jobs
    const topSkills = await query(`
      SELECT 
        UNNEST(skills) as skill,
        COUNT(*) as count
      FROM jobs
      WHERE skills IS NOT NULL
      GROUP BY UNNEST(skills)
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get employment types distribution
    const employmentTypes = await query(`
      SELECT 
        UNNEST(employment_type) as type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM jobs
      WHERE employment_type IS NOT NULL
      GROUP BY UNNEST(employment_type)
      ORDER BY count DESC
    `);

    const stats = jobStats.rows[0];
    data = {
      totalJobs: parseInt(stats.total_jobs),
      newJobsToday: parseInt(stats.new_jobs_today),
      topLocations: topLocations.rows.map(location => ({
        location: location.location,
        count: parseInt(location.count)
      })),
      topSkills: topSkills.rows.map(skill => ({
        skill: skill.skill,
        count: parseInt(skill.count)
      })),
      employmentTypes: employmentTypes.rows.map(type => ({
        type: type.type,
        count: parseInt(type.count),
        percentage: parseFloat(type.percentage)
      }))
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, data, 900);
  }

  res.json(data);
}));

module.exports = router;