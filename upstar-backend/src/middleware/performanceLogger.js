const { query } = require('../config/database');
const { logger } = require('./errorHandler');

// Performance logging middleware
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Log slow requests
      if (responseTime > threshold) {
        logger.warn({
          type: 'SLOW_REQUEST',
          method: req.method,
          url: req.originalUrl,
          responseTime,
          threshold,
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        });

        // Store slow request in database - DISABLED
        // Database logging disabled - no longer storing logs in database
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

// Store slow request in database - DISABLED
async function storeSlowRequest(requestData) {
  // Database logging disabled - no longer storing logs in database
  return;
}

// Database query performance monitoring
const queryPerformanceLogger = (queryName) => {
  return async (queryFunction, ...args) => {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction(...args);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Log slow queries (threshold: 500ms)
      if (executionTime > 500) {
        logger.warn({
          type: 'SLOW_QUERY',
          queryName,
          executionTime,
          timestamp: new Date().toISOString()
        });

        // Store slow query in database - DISABLED
        // Database logging disabled - no longer storing logs in database
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      logger.error({
        type: 'QUERY_ERROR',
        queryName,
        executionTime,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  };
};

// Store slow query in database - DISABLED
async function storeSlowQuery(queryData) {
  // Database logging disabled - no longer storing logs in database
  return;
}

// Get performance metrics
async function getPerformanceMetrics(timeRange = '24h') {
  const timeRanges = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };

  const interval = timeRanges[timeRange] || '24 hours';

  // Get slow requests
  const slowRequestsQuery = `
    SELECT 
      COUNT(*) as total_slow_requests,
      AVG(response_time) as avg_response_time,
      MAX(response_time) as max_response_time,
      COUNT(DISTINCT url) as unique_slow_endpoints
    FROM slow_requests
    WHERE created_at > NOW() - INTERVAL '${interval}'
  `;

  // Get slow queries
  const slowQueriesQuery = `
    SELECT 
      COUNT(*) as total_slow_queries,
      AVG(execution_time) as avg_execution_time,
      MAX(execution_time) as max_execution_time,
      COUNT(DISTINCT query_name) as unique_slow_queries
    FROM slow_queries
    WHERE created_at > NOW() - INTERVAL '${interval}'
  `;

  // Get API performance
  const apiPerformanceQuery = `
    SELECT 
      COUNT(*) as total_requests,
      AVG(response_time) as avg_response_time,
      COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests,
      COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests
    FROM api_logs
    WHERE created_at > NOW() - INTERVAL '${interval}'
  `;

  try {
    const [slowRequestsResult, slowQueriesResult, apiPerformanceResult] = await Promise.all([
      query(slowRequestsQuery),
      query(slowQueriesQuery),
      query(apiPerformanceQuery)
    ]);

    return {
      timeRange,
      slowRequests: {
        total: parseInt(slowRequestsResult.rows[0].total_slow_requests || 0),
        avgResponseTime: parseFloat(slowRequestsResult.rows[0].avg_response_time || 0),
        maxResponseTime: parseInt(slowRequestsResult.rows[0].max_response_time || 0),
        uniqueEndpoints: parseInt(slowRequestsResult.rows[0].unique_slow_endpoints || 0)
      },
      slowQueries: {
        total: parseInt(slowQueriesResult.rows[0].total_slow_queries || 0),
        avgExecutionTime: parseFloat(slowQueriesResult.rows[0].avg_execution_time || 0),
        maxExecutionTime: parseInt(slowQueriesResult.rows[0].max_execution_time || 0),
        uniqueQueries: parseInt(slowQueriesResult.rows[0].unique_slow_queries || 0)
      },
      apiPerformance: {
        totalRequests: parseInt(apiPerformanceResult.rows[0].total_requests || 0),
        avgResponseTime: parseFloat(apiPerformanceResult.rows[0].avg_response_time || 0),
        slowRequests: parseInt(apiPerformanceResult.rows[0].slow_requests || 0),
        errorRequests: parseInt(apiPerformanceResult.rows[0].error_requests || 0),
        errorRate: apiPerformanceResult.rows[0].total_requests > 0 ? 
          ((apiPerformanceResult.rows[0].error_requests / apiPerformanceResult.rows[0].total_requests) * 100).toFixed(2) : 0
      }
    };
  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    throw error;
  }
}

// Get slow requests details
async function getSlowRequests(filters = {}) {
  const {
    page = 1,
    limit = 50,
    startDate,
    endDate,
    minResponseTime
  } = filters;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  if (startDate) {
    paramCount++;
    whereConditions.push(`created_at >= $${paramCount}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    paramCount++;
    whereConditions.push(`created_at <= $${paramCount}`);
    queryParams.push(endDate);
  }

  if (minResponseTime) {
    paramCount++;
    whereConditions.push(`response_time >= $${paramCount}`);
    queryParams.push(minResponseTime);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM slow_requests
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get slow requests
  const requestsQuery = `
    SELECT 
      id,
      method,
      url,
      response_time,
      threshold,
      user_id,
      ip,
      user_agent,
      created_at
    FROM slow_requests
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(limit, offset);
  const requestsResult = await query(requestsQuery, queryParams);

  const requests = requestsResult.rows.map(request => ({
    id: request.id,
    method: request.method,
    url: request.url,
    responseTime: request.response_time,
    threshold: request.threshold,
    userId: request.user_id,
    ip: request.ip,
    userAgent: request.user_agent,
    createdAt: request.created_at
  }));

  return {
    requests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  performanceLogger,
  queryPerformanceLogger,
  getPerformanceMetrics,
  getSlowRequests
};


