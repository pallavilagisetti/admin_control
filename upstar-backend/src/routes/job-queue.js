const express = require('express');
const router = express.Router();
const { resumeProcessingQueue, jobMatchingQueue, emailQueue, dataSyncQueue, analyticsQueue } = require('../jobs/processors');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/jobs/process-resume:
 *   post:
 *     summary: Queue resume processing job
 *     tags: [Job Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resumeId:
 *                 type: string
 *                 description: Resume ID to process
 *     responses:
 *       200:
 *         description: Resume processing job queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
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
router.post('/process-resume', requirePermission(['resumes:write']), [
  body('resumeId').isUUID().withMessage('Valid resume ID required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { resumeId } = req.body;

  // Check if resume exists
  const resumeResult = await query('SELECT id FROM resumes WHERE id = $1', [resumeId]);
  if (resumeResult.rows.length === 0) {
    throw new NotFoundError('Resume');
  }

  // Queue resume processing job
  const job = await resumeProcessingQueue.add('extract-skills', {
    resumeId: resumeId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  res.json({
    message: 'Resume processing job queued successfully',
    jobId: job.id
  });
}));

/**
 * @swagger
 * /api/jobs/match-users:
 *   post:
 *     summary: Queue user matching job
 *     tags: [Job Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to match
 *               resumeId:
 *                 type: string
 *                 description: Resume ID for matching
 *     responses:
 *       200:
 *         description: User matching job queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
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
router.post('/match-users', requirePermission(['jobs:write']), [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('resumeId').isUUID().withMessage('Valid resume ID required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { userId, resumeId } = req.body;

  // Check if user and resume exist
  const [userResult, resumeResult] = await Promise.all([
    query('SELECT id FROM users WHERE id = $1', [userId]),
    query('SELECT id FROM resumes WHERE id = $1', [resumeId])
  ]);

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User');
  }

  if (resumeResult.rows.length === 0) {
    throw new NotFoundError('Resume');
  }

  // Queue user matching job
  const job = await jobMatchingQueue.add('match-user-jobs', {
    userId: userId,
    resumeId: resumeId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  res.json({
    message: 'User matching job queued successfully',
    jobId: job.id
  });
}));

/**
 * @swagger
 * /api/jobs/status/{id}:
 *   get:
 *     summary: Get job status
 *     tags: [Job Queue]
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
 *         description: Job status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 progress:
 *                   type: number
 *                 result:
 *                   type: object
 *                 error:
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
router.get('/status/:id', requirePermission(['jobs:read']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check all job queues for the job
  const queues = [resumeProcessingQueue, jobMatchingQueue, emailQueue, dataSyncQueue, analyticsQueue];
  let job = null;
  let queueName = null;

  for (const queue of queues) {
    try {
      job = await queue.getJob(id);
      if (job) {
        queueName = queue.name;
        break;
      }
    } catch (error) {
      // Continue to next queue
    }
  }

  if (!job) {
    throw new NotFoundError('Job');
  }

  const jobState = await job.getState();
  const progress = job.progress();

  res.json({
    jobId: job.id,
    status: jobState,
    progress: progress,
    result: job.returnvalue,
    error: job.failedReason,
    queue: queueName,
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : null,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : null
  });
}));

/**
 * @swagger
 * /api/jobs/queue-stats:
 *   get:
 *     summary: Get job queue statistics
 *     tags: [Job Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job queue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       waiting:
 *                         type: integer
 *                       active:
 *                         type: integer
 *                       completed:
 *                         type: integer
 *                       failed:
 *                         type: integer
 *                       delayed:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/queue-stats', requirePermission(['system:read']), asyncHandler(async (req, res) => {
  const queues = [
    { name: 'resume-processing', queue: resumeProcessingQueue },
    { name: 'job-matching', queue: jobMatchingQueue },
    { name: 'email-notifications', queue: emailQueue },
    { name: 'data-sync', queue: dataSyncQueue },
    { name: 'analytics', queue: analyticsQueue }
  ];

  const stats = await Promise.all(queues.map(async ({ name, queue }) => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      name,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    };
  }));

  res.json({ queues: stats });
}));

/**
 * @swagger
 * /api/jobs/retry/{id}:
 *   post:
 *     summary: Retry failed job
 *     tags: [Job Queue]
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
 *         description: Job retry initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
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
router.post('/retry/:id', requirePermission(['jobs:write']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check all job queues for the job
  const queues = [resumeProcessingQueue, jobMatchingQueue, emailQueue, dataSyncQueue, analyticsQueue];
  let job = null;

  for (const queue of queues) {
    try {
      job = await queue.getJob(id);
      if (job) break;
    } catch (error) {
      // Continue to next queue
    }
  }

  if (!job) {
    throw new NotFoundError('Job');
  }

  // Retry the job
  await job.retry();

  res.json({
    message: 'Job retry initiated successfully',
    jobId: job.id
  });
}));

module.exports = router;





