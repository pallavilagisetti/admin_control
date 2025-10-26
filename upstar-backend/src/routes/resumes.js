const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/resumes:
 *   get:
 *     summary: Get all resumes with processing status
 *     tags: [Resumes]
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
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *         description: Filter by processing status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of resumes with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *                       fileType:
 *                         type: string
 *                       processingStatus:
 *                         type: string
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                       processedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
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
router.get('/', requirePermission(['resumes:read']), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    userId
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (status) {
    paramCount++;
    whereConditions.push(`r.processing_status = $${paramCount}`);
    queryParams.push(status);
  }

  if (userId) {
    paramCount++;
    whereConditions.push(`r.user_id = $${paramCount}`);
    queryParams.push(userId);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM resumes r
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get resumes with pagination
  const resumesQuery = `
    SELECT 
      r.id,
      r.user_id,
      r.filename,
      r.file_size,
      r.file_type,
      r.processing_status,
      r.uploaded_at,
      r.processed_at,
      r.error_message,
      u.name as user_name,
      u.email as user_email
    FROM resumes r
    JOIN users u ON r.user_id = u.id
    ${whereClause}
    ORDER BY r.uploaded_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(parseInt(limit), offset);
  const resumesResult = await query(resumesQuery, queryParams);

  const resumes = resumesResult.rows.map(resume => ({
    id: resume.id,
    userId: resume.user_id,
    filename: resume.filename,
    fileSize: parseInt(resume.file_size),
    fileType: resume.file_type,
    processingStatus: resume.processing_status,
    uploadedAt: resume.uploaded_at,
    processedAt: resume.processed_at,
    errorMessage: resume.error_message,
    user: {
      name: resume.user_name,
      email: resume.user_email
    }
  }));

  res.json({
    resumes,
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
 * /api/resumes/{id}:
 *   get:
 *     summary: Get specific resume details and parsed data
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: Resume details with parsed data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 processingStatus:
 *                   type: string
 *                 extractedText:
 *                   type: string
 *                 structuredData:
 *                   type: object
 *                   properties:
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     education:
 *                       type: string
 *                     experience:
 *                       type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', requirePermission(['resumes:read']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resumeQuery = `
    SELECT 
      r.id,
      r.user_id,
      r.filename,
      r.processing_status,
      r.extracted_text,
      r.structured_data,
      r.uploaded_at,
      r.processed_at,
      r.error_message,
      u.name as user_name,
      u.email as user_email
    FROM resumes r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = $1
  `;

  const result = await query(resumeQuery, [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Resume');
  }

  const resume = result.rows[0];
  const resumeData = {
    id: resume.id,
    userId: resume.user_id,
    filename: resume.filename,
    processingStatus: resume.processing_status,
    extractedText: resume.extracted_text,
    structuredData: resume.structured_data ? (typeof resume.structured_data === 'string' ? JSON.parse(resume.structured_data) : resume.structured_data) : null,
    uploadedAt: resume.uploaded_at,
    processedAt: resume.processed_at,
    errorMessage: resume.error_message,
    user: {
      name: resume.user_name,
      email: resume.user_email
    }
  };

  res.json(resumeData);
}));

/**
 * @swagger
 * /api/resumes/{id}/reprocess:
 *   post:
 *     summary: Trigger reprocessing of a resume
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: Resume queued for reprocessing
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
router.post('/:id/reprocess', requirePermission(['resumes:write']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { v4: uuidv4 } = require('uuid');

  // Check if resume exists
  const resumeResult = await query('SELECT id, processing_status FROM resumes WHERE id = $1', [id]);
  if (resumeResult.rows.length === 0) {
    throw new NotFoundError('Resume');
  }

  const resume = resumeResult.rows[0];

  // Update status to PENDING
  await query(
    'UPDATE resumes SET processing_status = $1, updated_at = NOW() WHERE id = $2',
    ['PENDING', id]
  );

  // Generate job ID
  const jobId = uuidv4();

  // In a real implementation, you would queue this job with Bull Queue
  // For now, we'll simulate the job creation
  const jobData = {
    resumeId: id,
    jobId: jobId,
    type: 'RESUME_PROCESSING',
    priority: 'normal',
    createdAt: new Date().toISOString()
  };

  // Cache cleared (no longer using Redis)

  res.json({
    message: 'Resume queued for reprocessing',
    jobId: jobId
  });
}));

/**
 * @swagger
 * /api/resumes/{id}/download:
 *   get:
 *     summary: Download resume file
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: Resume file download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/download', requirePermission(['resumes:read']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get resume file information
  const resumeResult = await query(
    'SELECT filename, file_path, file_type FROM resumes WHERE id = $1',
    [id]
  );

  if (resumeResult.rows.length === 0) {
    throw new NotFoundError('Resume');
  }

  const resume = resumeResult.rows[0];

  // In a real implementation, you would stream the file from S3 or local storage
  // For now, we'll return a placeholder response
  res.setHeader('Content-Disposition', `attachment; filename="${resume.filename}"`);
  res.setHeader('Content-Type', resume.file_type || 'application/octet-stream');
  
  res.json({
    message: 'File download initiated',
    filename: resume.filename,
    downloadUrl: `/api/resumes/${id}/file` // This would be the actual file URL
  });
}));

module.exports = router;



