const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(',');
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`File type .${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * @swagger
 * /api/upload/resume:
 *   post:
 *     summary: Upload resume file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Resume file to upload
 *               userId:
 *                 type: string
 *                 description: User ID (optional, defaults to authenticated user)
 *     responses:
 *       200:
 *         description: Resume uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resumeId:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                 fileUrl:
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
router.post('/resume', requirePermission(['resumes:write']), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file provided');
  }

  const { userId } = req.body;
  const targetUserId = userId || req.user.id;
  const file = req.file;
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const filename = `${uuidv4()}.${fileExtension}`;
  const filePath = `resumes/${targetUserId}/${filename}`;

  try {
    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        userId: targetUserId,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Save resume record to database
    const resumeId = uuidv4();
    await query(
      `INSERT INTO resumes (id, user_id, filename, file_path, file_size, file_type, processing_status, uploaded_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())`,
      [
        resumeId,
        targetUserId,
        file.originalname,
        uploadResult.Location,
        file.size,
        file.mimetype,
        'PENDING'
      ]
    );

    // Queue resume processing job
    const { resumeProcessingQueue } = require('../jobs/processors');
    await resumeProcessingQueue.add('extract-skills', {
      resumeId: resumeId
    });

    res.json({
      message: 'Resume uploaded successfully',
      resumeId: resumeId,
      filename: file.originalname,
      fileSize: file.size,
      fileUrl: uploadResult.Location
    });
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
}));

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 avatarUrl:
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
router.post('/avatar', requirePermission(['users:write']), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file provided');
  }

  const file = req.file;
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const filename = `${uuidv4()}.${fileExtension}`;
  const filePath = `avatars/${req.user.id}/${filename}`;

  // Validate image file
  const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!allowedImageTypes.includes(fileExtension)) {
    throw new ValidationError(`Image type .${fileExtension} not allowed. Allowed types: ${allowedImageTypes.join(', ')}`);
  }

  try {
    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        userId: req.user.id,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Update user avatar in database
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [uploadResult.Location, req.user.id]
    );

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: uploadResult.Location
    });
  } catch (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
}));

/**
 * @swagger
 * /api/upload/document:
 *   post:
 *     summary: Upload document file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *               category:
 *                 type: string
 *                 description: Document category
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentId:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 fileUrl:
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
router.post('/document', requirePermission(['cms:write']), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file provided');
  }

  const { category } = req.body;
  const file = req.file;
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const filename = `${uuidv4()}.${fileExtension}`;
  const filePath = `documents/${category || 'general'}/${filename}`;

  try {
    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        category: category || 'general',
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Save document record to database
    const documentId = uuidv4();
    await query(
      `INSERT INTO documents (id, filename, file_path, file_size, file_type, category, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        documentId,
        file.originalname,
        uploadResult.Location,
        file.size,
        file.mimetype,
        category || 'general',
        req.user.id
      ]
    );

    res.json({
      message: 'Document uploaded successfully',
      documentId: documentId,
      filename: file.originalname,
      fileUrl: uploadResult.Location
    });
  } catch (error) {
    throw new Error(`Document upload failed: ${error.message}`);
  }
}));

/**
 * @swagger
 * /api/upload/delete/{fileId}:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
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
router.delete('/delete/:fileId', requirePermission(['files:write']), asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  // Get file information from database
  const fileResult = await query(
    'SELECT file_path, user_id FROM resumes WHERE id = $1',
    [fileId]
  );

  if (fileResult.rows.length === 0) {
    throw new NotFoundError('File');
  }

  const file = fileResult.rows[0];

  // Check if user has permission to delete this file
  if (file.user_id !== req.user.id && !req.user.roles.includes('admin')) {
    throw new ValidationError('You do not have permission to delete this file');
  }

  try {
    // Extract S3 key from URL
    const url = new URL(file.file_path);
    const s3Key = url.pathname.substring(1); // Remove leading slash

    // Delete from S3
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    }).promise();

    // Delete from database
    await query('DELETE FROM resumes WHERE id = $1', [fileId]);

    res.json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}));

module.exports = router;






