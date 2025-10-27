const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/notifications/history:
 *   get:
 *     summary: Get notification history
 *     tags: [Notifications]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, push, sms, in_app]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notification history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       recipients:
 *                         type: integer
 *                       sentAt:
 *                         type: string
 *                         format: date
 *                       openRate:
 *                         type: string
 *                       status:
 *                         type: string
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
router.get('/history', requirePermission(['notifications:read']), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    type
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (type) {
    paramCount++;
    whereConditions.push(`type = $${paramCount}`);
    queryParams.push(type);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get notifications with pagination
  const notificationsQuery = `
    SELECT 
      id,
      title,
      content,
      type,
      recipients_count,
      sent_at,
      open_rate,
      status,
      created_at
    FROM notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(parseInt(limit), offset);
  const notificationsResult = await query(notificationsQuery, queryParams);

  const notifications = notificationsResult.rows.map(notification => ({
    id: notification.id,
    title: notification.title,
    recipients: parseInt(notification.recipients_count),
    sentAt: notification.sent_at,
    openRate: notification.open_rate ? `${(notification.open_rate * 100).toFixed(1)}%` : 'N/A',
    status: notification.status
  }));

  res.json({
    notifications,
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
 * /api/notifications/send:
 *   post:
 *     summary: Send notification to users
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [All Users, Premium Users, Free Users, Specific Users]
 *               schedule:
 *                 type: string
 *                 enum: [now, scheduled]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [email, push, sms, in_app]
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notificationId:
 *                   type: string
 *                 recipients:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/send', requirePermission(['notifications:write']), [
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be between 1-200 characters'),
  body('content').isString().isLength({ min: 1, max: 1000 }).withMessage('Content is required and must be between 1-1000 characters'),
  body('audience').isIn(['All Users', 'Premium Users', 'Free Users', 'Specific Users']).withMessage('Invalid audience type'),
  body('schedule').isIn(['now', 'scheduled']).withMessage('Invalid schedule type'),
  body('type').isIn(['email', 'push', 'sms', 'in_app']).withMessage('Invalid notification type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const {
    title,
    content,
    audience,
    schedule,
    scheduledAt,
    type
  } = req.body;

  // Validate scheduled notification
  if (schedule === 'scheduled' && !scheduledAt) {
    throw new ValidationError('Scheduled time is required for scheduled notifications');
  }

  if (schedule === 'scheduled' && new Date(scheduledAt) <= new Date()) {
    throw new ValidationError('Scheduled time must be in the future');
  }

  // Determine recipient count based on audience
  let recipientCount = 0;
  let audienceQuery = '';

  switch (audience) {
    case 'All Users':
      audienceQuery = 'SELECT COUNT(*) as count FROM users WHERE active = true';
      break;
    case 'Premium Users':
      audienceQuery = 'SELECT COUNT(*) as count FROM users WHERE active = true AND subscription_tier IN (\'pro\', \'enterprise\')';
      break;
    case 'Free Users':
      audienceQuery = 'SELECT COUNT(*) as count FROM users WHERE active = true AND subscription_tier = \'free\'';
      break;
    case 'Specific Users':
      // This would require additional user selection logic
      recipientCount = 0; // Placeholder
      break;
  }

  if (audienceQuery) {
    const countResult = await query(audienceQuery);
    recipientCount = parseInt(countResult.rows[0].count);
  }

  // Create notification record
  const { v4: uuidv4 } = require('uuid');
  const notificationId = uuidv4();

  await query(
    `INSERT INTO notifications (id, title, content, type, audience, recipients_count, status, scheduled_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      notificationId,
      title,
      content,
      type,
      audience,
      recipientCount,
      schedule === 'now' ? 'sent' : 'scheduled',
      schedule === 'scheduled' ? scheduledAt : null
    ]
  );

  // If sending now, queue the notification job
  if (schedule === 'now') {
    // In a real implementation, you would queue this with Bull Queue
    console.log(`Queuing notification ${notificationId} for ${recipientCount} recipients`);
  }

  res.json({
    message: schedule === 'now' ? 'Notification sent successfully' : 'Notification scheduled successfully',
    notificationId: notificationId,
    recipients: recipientCount
  });
}));

/**
 * @swagger
 * /api/notifications/reminders:
 *   get:
 *     summary: Get automated reminders
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of automated reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reminders:
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
 *                       cadence:
 *                         type: string
 *                       enabled:
 *                         type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/reminders', requirePermission(['notifications:read']), asyncHandler(async (req, res) => {
  const remindersQuery = `
    SELECT 
      id,
      title,
      description,
      cadence,
      enabled,
      created_at,
      last_triggered
    FROM notification_reminders
    ORDER BY created_at DESC
  `;

  const result = await query(remindersQuery);
  
  const reminders = result.rows.map(reminder => ({
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    cadence: reminder.cadence,
    enabled: reminder.enabled,
    lastTriggered: reminder.last_triggered
  }));

  res.json({ reminders });
}));

/**
 * @swagger
 * /api/notifications/reminders:
 *   post:
 *     summary: Create new reminder
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               cadence:
 *                 type: string
 *                 enum: [Daily, Weekly, Monthly, Event-based]
 *               enabled:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Reminder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reminderId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/reminders', requirePermission(['notifications:write']), [
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be between 1-200 characters'),
  body('description').isString().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be between 1-500 characters'),
  body('cadence').isIn(['Daily', 'Weekly', 'Monthly', 'Event-based']).withMessage('Invalid cadence type'),
  body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { title, description, cadence, enabled = true } = req.body;

  const { v4: uuidv4 } = require('uuid');
  const reminderId = uuidv4();

  await query(
    `INSERT INTO notification_reminders (id, title, description, cadence, enabled, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [reminderId, title, description, cadence, enabled]
  );

  res.json({
    message: 'Reminder created successfully',
    reminderId: reminderId
  });
}));

/**
 * @swagger
 * /api/notifications/reminders/{reminderId}/toggle:
 *   post:
 *     summary: Toggle reminder enabled/disabled status
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     responses:
 *       200:
 *         description: Reminder status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 enabled:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/reminders/:reminderId/toggle', requirePermission(['notifications:write']), asyncHandler(async (req, res) => {
  const { reminderId } = req.params;

  // Check if reminder exists
  const reminderResult = await query(
    'SELECT id, enabled FROM notification_reminders WHERE id = $1',
    [reminderId]
  );

  if (reminderResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Reminder not found',
      code: 'NOT_FOUND'
    });
  }

  const reminder = reminderResult.rows[0];
  const newStatus = !reminder.enabled;

  // Toggle the reminder status
  await query(
    'UPDATE notification_reminders SET enabled = $1, updated_at = NOW() WHERE id = $2',
    [newStatus, reminderId]
  );

  res.json({
    message: `Reminder ${newStatus ? 'enabled' : 'disabled'} successfully`,
    enabled: newStatus
  });
}));

/**
 * @swagger
 * /api/notifications/templates:
 *   get:
 *     summary: Get notification templates
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notification templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       content:
 *                         type: string
 *                       type:
 *                         type: string
 *                       variables:
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
router.get('/templates', requirePermission(['notifications:read']), asyncHandler(async (req, res) => {
  const templatesQuery = `
    SELECT 
      id,
      name,
      subject,
      content,
      type,
      variables,
      created_at,
      updated_at
    FROM notification_templates
    ORDER BY name
  `;

  const result = await query(templatesQuery);
  
  const templates = result.rows.map(template => ({
    id: template.id,
    name: template.name,
    subject: template.subject,
    content: template.content,
    type: template.type,
    variables: template.variables || [],
    createdAt: template.created_at,
    updatedAt: template.updated_at
  }));

  res.json({ templates });
}));

module.exports = router;






