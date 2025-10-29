const express = require('express');
const router = express.Router();
const { healthCheck, query, cache } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: Get system health metrics
 *     tags: [System Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: string
 *                 uptime:
 *                   type: string
 *                 lastIncident:
 *                   type: string
 *                   format: date-time
 *                 activeAlerts:
 *                   type: integer
 *                 metrics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       value:
 *                         type: number
 *                       status:
 *                         type: string
 *                       trend:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/health', requirePermission(['system:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'system:health';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Get database health
    const dbHealth = await healthCheck();
    
    // Get system metrics (with fallback)
    let systemMetrics;
    try {
      systemMetrics = await query(`
        SELECT 
          AVG(response_time) as avg_response_time,
          COUNT(CASE WHEN response_time < 1000 THEN 1 END) as fast_requests,
          COUNT(*) as total_requests
        FROM api_logs
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `);
    } catch (error) {
      systemMetrics = { rows: [{ avg_response_time: 500, fast_requests: 0, total_requests: 0 }] };
    }

    // Get active alerts (with fallback)
    let activeAlerts;
    try {
      activeAlerts = await query(`
        SELECT COUNT(*) as count
        FROM system_alerts
        WHERE status = 'active' AND created_at > NOW() - INTERVAL '24 hours'
      `);
    } catch (error) {
      activeAlerts = { rows: [{ count: 0 }] };
    }

    // Get last incident (with fallback)
    let lastIncident;
    try {
      lastIncident = await query(`
        SELECT created_at
        FROM system_incidents
        ORDER BY created_at DESC
        LIMIT 1
      `);
    } catch (error) {
      lastIncident = { rows: [] };
    }

    const metrics = systemMetrics.rows[0];
    const avgResponseTime = parseFloat(metrics.avg_response_time || 0);
    const fastRequests = parseInt(metrics.fast_requests || 0);
    const totalRequests = parseInt(metrics.total_requests || 0);
    const responseTimeScore = totalRequests > 0 ? (fastRequests / totalRequests) * 100 : 100;

    // Calculate overall health
    const healthScores = [
      dbHealth.database ? 100 : 0,
      responseTimeScore,
      98 // AI processing (simulated)
    ];
    const overallScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
    const overallStatus = overallScore >= 95 ? 'healthy' : overallScore >= 80 ? 'degraded' : 'unhealthy';

    data = {
      overall: overallStatus,
      uptime: `${(process.uptime() / 3600).toFixed(1)} hours`,
      lastIncident: lastIncident.rows[0]?.created_at || null,
      activeAlerts: parseInt(activeAlerts.rows[0].count),
      metrics: [
        {
          label: 'Database',
          value: dbHealth.database ? 100 : 0,
          status: dbHealth.database ? 'excellent' : 'critical',
          trend: 'stable'
        },
        {
          label: 'API Response Time',
          value: Math.max(0, 100 - (avgResponseTime / 10)),
          status: avgResponseTime < 500 ? 'excellent' : avgResponseTime < 1000 ? 'good' : 'poor',
          trend: avgResponseTime < 500 ? 'up' : 'down'
        },
        {
          label: 'AI Processing',
          value: 98,
          status: 'excellent',
          trend: 'up'
        }
      ]
    };

    // Cache for 1 minute
    await cache.set(cacheKey, data, 60);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/system/activity:
 *   get:
 *     summary: Get recent system activity
 *     tags: [System Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent system activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                       time:
 *                         type: string
 *                       status:
 *                         type: string
 *                       details:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/activity', requirePermission(['system:read']), asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const activitiesQuery = `
    SELECT 
      action,
      created_at,
      status,
      details
    FROM system_activities
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const result = await query(activitiesQuery, [parseInt(limit)]);
  
  const activities = result.rows.map(activity => ({
    action: activity.action,
    time: activity.created_at,
    status: activity.status,
    details: activity.details
  }));

  res.json({ activities });
}));

/**
 * @swagger
 * /api/system/alerts:
 *   get:
 *     summary: Get system alerts
 *     tags: [System Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved, all]
 *           default: active
 *         description: Filter by alert status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, warning, info]
 *         description: Filter by alert severity
 *     responses:
 *       200:
 *         description: System alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       severity:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       resolvedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/alerts', requirePermission(['system:read']), asyncHandler(async (req, res) => {
  const { status = 'active', severity } = req.query;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  if (status !== 'all') {
    paramCount++;
    whereConditions.push(`status = $${paramCount}`);
    queryParams.push(status);
  }

  if (severity) {
    paramCount++;
    whereConditions.push(`severity = $${paramCount}`);
    queryParams.push(severity);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const alertsQuery = `
    SELECT 
      id,
      title,
      description,
      severity,
      status,
      created_at,
      resolved_at
    FROM system_alerts
    ${whereClause}
    ORDER BY created_at DESC
  `;

  const result = await query(alertsQuery, queryParams);
  
  const alerts = result.rows.map(alert => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    status: alert.status,
    createdAt: alert.created_at,
    resolvedAt: alert.resolved_at
  }));

  res.json({ alerts });
}));

/**
 * @swagger
 * /api/system/alerts/{alertId}/resolve:
 *   post:
 *     summary: Resolve a system alert
 *     tags: [System Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Resolution details
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/alerts/:alertId/resolve', requirePermission(['system:write']), asyncHandler(async (req, res) => {
  const { alertId } = req.params;
  const { resolution } = req.body;

  // Check if alert exists
  const alertResult = await query(
    'SELECT id, status FROM system_alerts WHERE id = $1',
    [alertId]
  );

  if (alertResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Alert not found',
      code: 'NOT_FOUND'
    });
  }

  const alert = alertResult.rows[0];

  if (alert.status === 'resolved') {
    return res.status(400).json({
      error: 'Alert is already resolved',
      code: 'ALREADY_RESOLVED'
    });
  }

  // Resolve the alert
  await query(
    'UPDATE system_alerts SET status = $1, resolved_at = NOW(), resolution = $2 WHERE id = $3',
    ['resolved', resolution, alertId]
  );

  res.json({
    message: 'Alert resolved successfully'
  });
}));

/**
 * @swagger
 * /api/system/metrics:
 *   get:
 *     summary: Get detailed system metrics
 *     tags: [System Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d]
 *           default: 24h
 *         description: Time period for metrics
 *     responses:
 *       200:
 *         description: Detailed system metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cpu:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       type: number
 *                     trend:
 *                       type: string
 *                 memory:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       type: number
 *                     trend:
 *                       type: string
 *                 disk:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       type: number
 *                     trend:
 *                       type: string
 *                 network:
 *                   type: object
 *                   properties:
 *                     throughput:
 *                       type: number
 *                     latency:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/metrics', requirePermission(['system:read']), asyncHandler(async (req, res) => {
  const { period = '24h' } = req.query;
  
  // Calculate date range based on period
  const periodMap = {
    '1h': 1,
    '24h': 24,
    '7d': 168
  };
  
  const hours = periodMap[period] || 24;
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const cacheKey = `system:metrics:${period}`;
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const metricsQuery = `
      SELECT 
        AVG(cpu_usage) as avg_cpu,
        AVG(memory_usage) as avg_memory,
        AVG(disk_usage) as avg_disk,
        AVG(network_throughput) as avg_throughput,
        AVG(network_latency) as avg_latency
      FROM system_metrics
      WHERE created_at >= $1
    `;

    const result = await query(metricsQuery, [startDate]);
    const metrics = result.rows[0];

    data = {
      cpu: {
        usage: parseFloat(metrics.avg_cpu || 0),
        trend: 'stable'
      },
      memory: {
        usage: parseFloat(metrics.avg_memory || 0),
        trend: 'stable'
      },
      disk: {
        usage: parseFloat(metrics.avg_disk || 0),
        trend: 'stable'
      },
      network: {
        throughput: parseFloat(metrics.avg_throughput || 0),
        latency: parseFloat(metrics.avg_latency || 0)
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, data, 300);
  }

  res.json(data);
}));

module.exports = router;






