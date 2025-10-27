const express = require('express');
const router = express.Router();
const { healthCheck, query, cache } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Get detailed system status
 *     tags: [System Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed system status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: string
 *                 uptime:
 *                   type: string
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     connectionCount:
 *                       type: integer
 *                     maxConnections:
 *                       type: integer
 *                     queryTime:
 *                       type: number
 *                 redis:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: string
 *                         peak:
 *                           type: string
 *                     keys:
 *                       type: integer
 *                 system:
 *                   type: object
 *                   properties:
 *                     cpu:
 *                       type: number
 *                     memory:
 *                       type: number
 *                     disk:
 *                       type: number
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       responseTime:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/detailed', requirePermission(['system:read']), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Get database health
    const dbHealth = await healthCheck();
    
    // Get database connection info
    const dbInfo = await query(`
      SELECT 
        count(*) as connection_count,
        setting as max_connections
      FROM pg_stat_activity, pg_settings 
      WHERE name = 'max_connections'
    `);

    // Get Redis info
    let redisInfo = null;
    try {
      const redisClient = require('../config/database').getRedisClient();
      if (redisClient) {
        const info = await redisClient.info('memory');
        const keyspace = await redisClient.info('keyspace');
        
        redisInfo = {
          status: 'connected',
          memory: {
            used: info.match(/used_memory_human:([^\r\n]+)/)?.[1] || '0B',
            peak: info.match(/used_memory_peak_human:([^\r\n]+)/)?.[1] || '0B'
          },
          keys: parseInt(keyspace.match(/db0:keys=(\d+)/)?.[1] || '0')
        };
      }
    } catch (error) {
      redisInfo = {
        status: 'disconnected',
        error: error.message
      };
    }

    // Get system metrics
    const systemMetrics = await query(`
      SELECT 
        AVG(cpu_usage) as avg_cpu,
        AVG(memory_usage) as avg_memory,
        AVG(disk_usage) as avg_disk
      FROM system_metrics
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);

    // Get API performance metrics
    const apiMetrics = await query(`
      SELECT 
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
        COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests
      FROM api_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);

    // Check external services
    const services = await Promise.all([
      checkService('Auth0', `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`),
      checkService('OpenAI', 'https://api.openai.com/v1/models'),
      checkService('AWS S3', 'https://s3.amazonaws.com/')
    ]);

    const responseTime = Date.now() - startTime;
    const systemStats = systemMetrics.rows[0];
    const apiStats = apiMetrics.rows[0];
    const dbStats = dbInfo.rows[0];

    // Calculate overall health score
    const healthScores = [
      dbHealth.database ? 100 : 0,
      dbHealth.redis ? 100 : 0,
      systemStats.avg_cpu < 80 ? 100 : 50,
      systemStats.avg_memory < 80 ? 100 : 50,
      apiStats.avg_response_time < 1000 ? 100 : 50
    ];
    const overallScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
    const overallStatus = overallScore >= 90 ? 'healthy' : overallScore >= 70 ? 'degraded' : 'unhealthy';

    const detailedHealth = {
      overall: overallStatus,
      uptime: `${(process.uptime() / 3600).toFixed(1)} hours`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: responseTime,
      database: {
        status: dbHealth.database ? 'connected' : 'disconnected',
        connectionCount: parseInt(dbStats.connection_count),
        maxConnections: parseInt(dbStats.max_connections),
        queryTime: responseTime
      },
      redis: redisInfo,
      system: {
        cpu: parseFloat(systemStats.avg_cpu || 0),
        memory: parseFloat(systemStats.avg_memory || 0),
        disk: parseFloat(systemStats.avg_disk || 0)
      },
      api: {
        totalRequests: parseInt(apiStats.total_requests || 0),
        avgResponseTime: parseFloat(apiStats.avg_response_time || 0),
        errorRate: apiStats.total_requests > 0 ? 
          ((apiStats.error_count / apiStats.total_requests) * 100).toFixed(2) : 0,
        slowRequests: parseInt(apiStats.slow_requests || 0)
      },
      services: services
    };

    res.json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      overall: 'unhealthy',
      error: error.message,
      uptime: `${(process.uptime() / 3600).toFixed(1)} hours`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  }
}));

// Helper function to check external services
async function checkService(name, url) {
  const startTime = Date.now();
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000 
    });
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime,
      statusCode: response.status
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

module.exports = router;






