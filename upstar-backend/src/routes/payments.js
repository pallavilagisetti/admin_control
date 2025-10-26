const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * /api/payments/subscriptions:
 *   get:
 *     summary: Get subscription data
 *     tags: [Payments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Cancelled, Expired, Pending]
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: List of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       plan:
 *                         type: string
 *                       status:
 *                         type: string
 *                       amount:
 *                         type: string
 *                       nextBilling:
 *                         type: string
 *                         format: date
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
router.get('/subscriptions', requirePermission(['payments:read']), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (status) {
    paramCount++;
    whereConditions.push(`s.status = $${paramCount}`);
    queryParams.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM subscriptions s
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get subscriptions with pagination
  const subscriptionsQuery = `
    SELECT 
      s.id,
      s.plan_name,
      s.status,
      s.amount,
      s.next_billing_date,
      s.created_at,
      u.name as user_name,
      u.email as user_email
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(parseInt(limit), offset);
  const subscriptionsResult = await query(subscriptionsQuery, queryParams);

  const subscriptions = subscriptionsResult.rows.map(subscription => ({
    id: subscription.id,
    user: {
      name: subscription.user_name,
      email: subscription.user_email
    },
    plan: subscription.plan_name,
    status: subscription.status,
    amount: `$${subscription.amount}`,
    nextBilling: subscription.next_billing_date
  }));

  res.json({
    subscriptions,
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
 * /api/payments/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Payments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Completed, Pending, Failed, Refunded]
 *         description: Filter by transaction status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, one_time, refund]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       type:
 *                         type: string
 *                       method:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
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
router.get('/transactions', requirePermission(['payments:read']), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    type
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (status) {
    paramCount++;
    whereConditions.push(`t.status = $${paramCount}`);
    queryParams.push(status);
  }

  if (type) {
    paramCount++;
    whereConditions.push(`t.type = $${paramCount}`);
    queryParams.push(type);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM transactions t
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get transactions with pagination
  const transactionsQuery = `
    SELECT 
      t.id,
      t.amount,
      t.status,
      t.type,
      t.payment_method,
      t.created_at,
      u.name as user_name
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(parseInt(limit), offset);
  const transactionsResult = await query(transactionsQuery, queryParams);

  const transactions = transactionsResult.rows.map(transaction => ({
    id: transaction.id,
    user: transaction.user_name,
    amount: parseFloat(transaction.amount),
    status: transaction.status,
    type: transaction.type,
    method: transaction.payment_method,
    date: transaction.created_at
  }));

  res.json({
    transactions,
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
 * /api/payments/analytics:
 *   get:
 *     summary: Get payment analytics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: object
 *                   properties:
 *                     monthly:
 *                       type: number
 *                     growth:
 *                       type: number
 *                 subscriptions:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: integer
 *                     growth:
 *                       type: number
 *                 conversion:
 *                   type: object
 *                   properties:
 *                     rate:
 *                       type: number
 *                     growth:
 *                       type: number
 *                 churn:
 *                   type: object
 *                   properties:
 *                     rate:
 *                       type: number
 *                     change:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/analytics', requirePermission(['analytics:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'payments:analytics';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Get revenue metrics
    const revenueMetrics = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' THEN amount ELSE 0 END), 0) as previous_month_revenue
      FROM transactions
      WHERE status = 'Completed'
    `);

    // Get subscription metrics
    const subscriptionMetrics = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'Active' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month,
        COUNT(CASE WHEN status = 'Active' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' THEN 1 END) as new_previous_month
      FROM subscriptions
    `);

    // Get conversion metrics
    const conversionMetrics = await query(`
      SELECT 
        AVG(conversion_rate) as avg_conversion_rate,
        AVG(conversion_rate_change) as conversion_rate_change
      FROM conversion_metrics
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    // Get churn metrics
    const churnMetrics = await query(`
      SELECT 
        AVG(churn_rate) as avg_churn_rate,
        AVG(churn_rate_change) as churn_rate_change
      FROM churn_metrics
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    const revenue = revenueMetrics.rows[0];
    const subscriptions = subscriptionMetrics.rows[0];
    const conversion = conversionMetrics.rows[0];
    const churn = churnMetrics.rows[0];

    const monthlyRevenue = parseFloat(revenue.monthly_revenue);
    const previousRevenue = parseFloat(revenue.previous_month_revenue);
    const revenueGrowth = previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const activeSubscriptions = parseInt(subscriptions.active_subscriptions);
    const newThisMonth = parseInt(subscriptions.new_this_month);
    const newPreviousMonth = parseInt(subscriptions.new_previous_month);
    const subscriptionGrowth = newPreviousMonth > 0 ? ((newThisMonth - newPreviousMonth) / newPreviousMonth) * 100 : 0;

    data = {
      revenue: {
        monthly: monthlyRevenue,
        growth: parseFloat(revenueGrowth.toFixed(1))
      },
      subscriptions: {
        active: activeSubscriptions,
        growth: parseFloat(subscriptionGrowth.toFixed(1))
      },
      conversion: {
        rate: parseFloat(conversion.avg_conversion_rate || 0),
        growth: parseFloat(conversion.conversion_rate_change || 0)
      },
      churn: {
        rate: parseFloat(churn.avg_churn_rate || 0),
        change: parseFloat(churn.churn_rate_change || 0)
      }
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, data, 900);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/payments/refunds:
 *   post:
 *     summary: Process a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 refundId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refunds', requirePermission(['payments:write']), asyncHandler(async (req, res) => {
  const { transactionId, amount, reason } = req.body;
  const { v4: uuidv4 } = require('uuid');

  // Validate required fields
  if (!transactionId || !amount || !reason) {
    return res.status(400).json({
      error: 'Transaction ID, amount, and reason are required',
      code: 'VALIDATION_ERROR'
    });
  }

  // Check if transaction exists and is eligible for refund
  const transactionResult = await query(
    'SELECT id, amount, status FROM transactions WHERE id = $1',
    [transactionId]
  );

  if (transactionResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Transaction not found',
      code: 'NOT_FOUND'
    });
  }

  const transaction = transactionResult.rows[0];
  
  if (transaction.status !== 'Completed') {
    return res.status(400).json({
      error: 'Only completed transactions can be refunded',
      code: 'INVALID_TRANSACTION_STATUS'
    });
  }

  if (amount > parseFloat(transaction.amount)) {
    return res.status(400).json({
      error: 'Refund amount cannot exceed transaction amount',
      code: 'INVALID_REFUND_AMOUNT'
    });
  }

  // Generate refund ID
  const refundId = uuidv4();

  // Create refund record
  await query(
    `INSERT INTO refunds (id, transaction_id, amount, reason, status, created_at) 
     VALUES ($1, $2, $3, $4, 'Pending', NOW())`,
    [refundId, transactionId, amount, reason]
  );

  res.json({
    message: 'Refund processed successfully',
    refundId: refundId
  });
}));

module.exports = router;





