const { query } = require('../config/database');
const { logger } = require('./errorHandler');

// Audit logging middleware
const auditLogger = (action, resource, details = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log audit event after response is sent
      setImmediate(async () => {
        try {
          await logAuditEvent({
            userId: req.user?.id,
            action,
            resource,
            details: {
              ...details,
              method: req.method,
              url: req.originalUrl,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              statusCode: res.statusCode,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          logger.error('Audit logging failed:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

// Log audit event
async function logAuditEvent(auditData) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        auditData.userId,
        auditData.action,
        auditData.resource,
        JSON.stringify(auditData.details)
      ]
    );
  } catch (error) {
    logger.error('Database error storing audit log:', error);
  }
}

// Specific audit loggers for common actions
const auditLoggers = {
  // User management
  userCreated: auditLogger('CREATE', 'user', { description: 'User account created' }),
  userUpdated: auditLogger('UPDATE', 'user', { description: 'User account updated' }),
  userDeleted: auditLogger('DELETE', 'user', { description: 'User account deleted' }),
  userLogin: auditLogger('LOGIN', 'user', { description: 'User logged in' }),
  userLogout: auditLogger('LOGOUT', 'user', { description: 'User logged out' }),

  // Resume management
  resumeUploaded: auditLogger('UPLOAD', 'resume', { description: 'Resume file uploaded' }),
  resumeProcessed: auditLogger('PROCESS', 'resume', { description: 'Resume processed' }),
  resumeDeleted: auditLogger('DELETE', 'resume', { description: 'Resume deleted' }),

  // Job management
  jobMatched: auditLogger('MATCH', 'job', { description: 'Job matched to user' }),
  jobApplied: auditLogger('APPLY', 'job', { description: 'User applied to job' }),

  // Payment management
  paymentProcessed: auditLogger('PAYMENT', 'transaction', { description: 'Payment processed' }),
  subscriptionChanged: auditLogger('UPDATE', 'subscription', { description: 'Subscription changed' }),

  // System management
  settingsUpdated: auditLogger('UPDATE', 'settings', { description: 'System settings updated' }),
  notificationSent: auditLogger('SEND', 'notification', { description: 'Notification sent' }),
  reportGenerated: auditLogger('GENERATE', 'report', { description: 'Report generated' }),

  // CMS management
  articleCreated: auditLogger('CREATE', 'article', { description: 'Article created' }),
  articleUpdated: auditLogger('UPDATE', 'article', { description: 'Article updated' }),
  articleDeleted: auditLogger('DELETE', 'article', { description: 'Article deleted' })
};

// Get audit logs
async function getAuditLogs(filters = {}) {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  if (userId) {
    paramCount++;
    whereConditions.push(`user_id = $${paramCount}`);
    queryParams.push(userId);
  }

  if (action) {
    paramCount++;
    whereConditions.push(`action = $${paramCount}`);
    queryParams.push(action);
  }

  if (resource) {
    paramCount++;
    whereConditions.push(`resource = $${paramCount}`);
    queryParams.push(resource);
  }

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

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM audit_logs
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get audit logs
  const logsQuery = `
    SELECT 
      al.id,
      al.user_id,
      al.action,
      al.resource,
      al.details,
      al.created_at,
      u.name as user_name,
      u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(limit, offset);
  const logsResult = await query(logsQuery, queryParams);

  const logs = logsResult.rows.map(log => ({
    id: log.id,
    userId: log.user_id,
    userName: log.user_name,
    userEmail: log.user_email,
    action: log.action,
    resource: log.resource,
    details: JSON.parse(log.details),
    createdAt: log.created_at
  }));

  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  auditLogger,
  auditLoggers,
  getAuditLogs
};






