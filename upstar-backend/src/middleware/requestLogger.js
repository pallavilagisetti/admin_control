const { query } = require('../config/database');
const { logger } = require('./errorHandler');

// Request logging middleware
const requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = require('uuid').v4();
  
  // Add request ID to request object
  req.id = requestId;
  
  // Log request start
  logger.info({
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log response
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('Content-Length') || 0,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Store in database for analytics
    storeRequestLog({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }).catch(error => {
      logger.error('Failed to store request log:', error);
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Store request log in database - DISABLED
async function storeRequestLog(logData) {
  // Database logging disabled - no longer storing logs in database
  return;
}

module.exports = requestLogger;


