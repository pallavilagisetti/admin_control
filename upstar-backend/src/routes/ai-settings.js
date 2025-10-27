const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/ai/settings:
 *   get:
 *     summary: Get AI configuration settings
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI settings configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       value:
 *                         type: number
 *                       type:
 *                         type: string
 *                       category:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/settings', requirePermission(['ai:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'ai:settings';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const settingsQuery = `
      SELECT 
        id,
        name,
        description,
        value,
        type,
        category,
        min_value,
        max_value,
        step,
        options
      FROM ai_settings
      ORDER BY category, name
    `;

    let result;
    try {
      result = await query(settingsQuery);
    } catch (error) {
      // Fallback if ai_settings table doesn't exist
      result = { rows: [] };
    }
    
    data = {
      settings: result.rows.map(setting => ({
        id: setting.id,
        name: setting.name,
        description: setting.description,
        value: parseFloat(setting.value),
        type: setting.type,
        category: setting.category,
        minValue: setting.min_value ? parseFloat(setting.min_value) : undefined,
        maxValue: setting.max_value ? parseFloat(setting.max_value) : undefined,
        step: setting.step ? parseFloat(setting.step) : undefined,
        options: setting.options ? JSON.parse(setting.options) : undefined
      }))
    };

    // Cache for 1 hour
    await cache.set(cacheKey, data, 3600);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/ai/settings:
 *   put:
 *     summary: Update AI settings
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     value:
 *                       type: number
 *     responses:
 *       200:
 *         description: AI settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedSettings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       value:
 *                         type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/settings', requirePermission(['ai:write']), [
  body('settings').isArray().withMessage('Settings must be an array'),
  body('settings.*.id').isString().withMessage('Setting ID is required'),
  body('settings.*.value').isNumeric().withMessage('Setting value must be numeric')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { settings } = req.body;
  const updatedSettings = [];

  // Update each setting
  for (const setting of settings) {
    const { id, value } = setting;
    
    // Validate setting exists and value is within range
    const settingResult = await query(
      'SELECT id, min_value, max_value FROM ai_settings WHERE id = $1',
      [id]
    );

    if (settingResult.rows.length === 0) {
      throw new ValidationError(`Setting with ID ${id} not found`);
    }

    const settingInfo = settingResult.rows[0];
    const minValue = settingInfo.min_value;
    const maxValue = settingInfo.max_value;

    if (minValue !== null && value < minValue) {
      throw new ValidationError(`Value for ${id} must be at least ${minValue}`);
    }

    if (maxValue !== null && value > maxValue) {
      throw new ValidationError(`Value for ${id} must be at most ${maxValue}`);
    }

    // Update the setting
    await query(
      'UPDATE ai_settings SET value = $1, updated_at = NOW() WHERE id = $2',
      [value, id]
    );

    updatedSettings.push({ id, value });
  }

  // Clear cache
  await cache.del('ai:settings');

  res.json({
    message: 'AI settings updated successfully',
    updatedSettings
  });
}));

/**
 * @swagger
 * /api/ai/models/status:
 *   get:
 *     summary: Get AI model status and performance
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI model status and performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       performance:
 *                         type: object
 *                         properties:
 *                           accuracy:
 *                             type: number
 *                           latency:
 *                             type: number
 *                           cost:
 *                             type: number
 *                       lastUpdated:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/models/status', requirePermission(['ai:read']), asyncHandler(async (req, res) => {
  const cacheKey = 'ai:models:status';
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const modelsQuery = `
      SELECT 
        name,
        status,
        accuracy,
        latency_ms,
        cost_per_request,
        last_updated,
        version,
        endpoint_url
      FROM ai_models
      ORDER BY name
    `;

    let result;
    try {
      result = await query(modelsQuery);
    } catch (error) {
      // Fallback if ai_models table doesn't exist
      result = { rows: [] };
    }
    
    data = {
      models: result.rows.map(model => ({
        name: model.name,
        status: model.status,
        performance: {
          accuracy: parseFloat(model.accuracy),
          latency: parseFloat(model.latency_ms),
          cost: parseFloat(model.cost_per_request)
        },
        version: model.version,
        endpointUrl: model.endpoint_url,
        lastUpdated: model.last_updated
      }))
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, data, 300);
  }

  res.json(data);
}));

/**
 * @swagger
 * /api/ai/models/{modelId}/test:
 *   post:
 *     summary: Test AI model with sample data
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID
 *     requestBody:
 *       required: true
 *       content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testData:
 *                   type: string
 *                   description: Sample data to test the model
 *     responses:
 *       200:
 *         description: Model test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: string
 *                 processingTime:
 *                   type: number
 *                 confidence:
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
router.post('/models/:modelId/test', requirePermission(['ai:write']), asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  const { testData } = req.body;

  // Check if model exists
  const modelResult = await query(
    'SELECT name, status, endpoint_url FROM ai_models WHERE id = $1',
    [modelId]
  );

  if (modelResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Model not found',
      code: 'NOT_FOUND'
    });
  }

  const model = modelResult.rows[0];

  if (model.status !== 'active') {
    return res.status(400).json({
      error: 'Model is not active',
      code: 'MODEL_INACTIVE'
    });
  }

  // Simulate model testing (in real implementation, you would call the actual AI service)
  const startTime = Date.now();
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  const processingTime = Date.now() - startTime;
  const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence

  // Log the test
  await query(
    'INSERT INTO ai_model_tests (model_id, test_data, processing_time, confidence, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [modelId, testData, processingTime, confidence]
  );

  res.json({
    success: true,
    result: `Processed: "${testData.substring(0, 100)}..."`,
    processingTime: processingTime,
    confidence: parseFloat(confidence.toFixed(2))
  });
}));

/**
 * @swagger
 * /api/ai/performance:
 *   get:
 *     summary: Get AI performance metrics
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time period for performance metrics
 *     responses:
 *       200:
 *         description: AI performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRequests:
 *                   type: integer
 *                 averageLatency:
 *                   type: number
 *                 successRate:
 *                   type: number
 *                 totalCost:
 *                   type: number
 *                 requestsByModel:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       model:
 *                         type: string
 *                       requests:
 *                         type: integer
 *                       avgLatency:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/performance', requirePermission(['ai:read']), asyncHandler(async (req, res) => {
  const { period = '24h' } = req.query;
  
  // Calculate date range based on period
  const periodMap = {
    '1h': 1,
    '24h': 24,
    '7d': 168,
    '30d': 720
  };
  
  const hours = periodMap[period] || 24;
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const cacheKey = `ai:performance:${period}`;
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    const performanceQuery = `
      SELECT 
        COUNT(*) as total_requests,
        AVG(processing_time) as avg_latency,
        AVG(CASE WHEN success = true THEN 1 ELSE 0 END) as success_rate,
        SUM(cost) as total_cost
      FROM ai_requests
      WHERE created_at >= $1
    `;

    const requestsByModelQuery = `
      SELECT 
        m.name as model,
        COUNT(r.id) as requests,
        AVG(r.processing_time) as avg_latency
      FROM ai_requests r
      JOIN ai_models m ON r.model_id = m.id
      WHERE r.created_at >= $1
      GROUP BY m.id, m.name
      ORDER BY requests DESC
    `;

    const [performanceResult, requestsByModelResult] = await Promise.all([
      (async () => {
        try {
          return await query(performanceQuery, [startDate]);
        } catch (error) {
          return { rows: [{ total_requests: 0, avg_latency: 0, success_rate: 0, total_cost: 0 }] };
        }
      })(),
      (async () => {
        try {
          return await query(requestsByModelQuery, [startDate]);
        } catch (error) {
          return { rows: [] };
        }
      })()
    ]);

    const performance = performanceResult.rows[0];
    data = {
      totalRequests: parseInt(performance.total_requests),
      averageLatency: parseFloat(performance.avg_latency || 0),
      successRate: parseFloat(performance.success_rate || 0),
      totalCost: parseFloat(performance.total_cost || 0),
      requestsByModel: requestsByModelResult.rows.map(model => ({
        model: model.model,
        requests: parseInt(model.requests),
        avgLatency: parseFloat(model.avg_latency || 0)
      }))
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, data, 300);
  }

  res.json(data);
}));

module.exports = router;






