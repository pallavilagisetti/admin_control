const express = require('express');
const router = express.Router();
const { query, cache } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/cms/articles:
 *   get:
 *     summary: Get CMS articles
 *     tags: [CMS]
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
 *           enum: [published, draft, archived]
 *         description: Filter by article status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by article category
 *     responses:
 *       200:
 *         description: List of CMS articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       content:
 *                         type: string
 *                       status:
 *                         type: string
 *                       category:
 *                         type: string
 *                       author:
 *                         type: string
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
router.get('/articles', requirePermission(['cms:read']), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    category
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build WHERE conditions
  if (status) {
    paramCount++;
    whereConditions.push(`status = $${paramCount}`);
    queryParams.push(status);
  }

  if (category) {
    paramCount++;
    whereConditions.push(`category = $${paramCount}`);
    queryParams.push(category);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM cms_articles
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // Get articles with pagination
  const articlesQuery = `
    SELECT 
      id,
      title,
      slug,
      content,
      status,
      category,
      author,
      published_at,
      updated_at,
      created_at
    FROM cms_articles
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;
  
  queryParams.push(parseInt(limit), offset);
  const articlesResult = await query(articlesQuery, queryParams);

  const articles = articlesResult.rows.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    status: article.status,
    category: article.category,
    author: article.author,
    publishedAt: article.published_at,
    updatedAt: article.updated_at
  }));

  res.json({
    articles,
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
 * /api/cms/articles:
 *   post:
 *     summary: Create new article
 *     tags: [CMS]
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
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [published, draft, archived]
 *                 default: draft
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 article:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/articles', requirePermission(['cms:write']), [
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be between 1-200 characters'),
  body('slug').isString().isLength({ min: 1, max: 100 }).withMessage('Slug is required and must be between 1-100 characters'),
  body('content').isString().isLength({ min: 1 }).withMessage('Content is required'),
  body('status').optional().isIn(['published', 'draft', 'archived']).withMessage('Invalid status'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const {
    title,
    slug,
    content,
    status = 'draft',
    category,
    tags = []
  } = req.body;

  // Check if slug already exists
  const existingArticle = await query(
    'SELECT id FROM cms_articles WHERE slug = $1',
    [slug]
  );

  if (existingArticle.rows.length > 0) {
    throw new ValidationError('Slug already exists');
  }

  const { v4: uuidv4 } = require('uuid');
  const articleId = uuidv4();

  // Create article
  await query(
    `INSERT INTO cms_articles (id, title, slug, content, status, category, tags, author, created_at, updated_at, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)`,
    [
      articleId,
      title,
      slug,
      content,
      status,
      category,
      JSON.stringify(tags),
      req.user.name, // Author from authenticated user
      status === 'published' ? new Date() : null
    ]
  );

  res.json({
    message: 'Article created successfully',
    article: {
      id: articleId,
      title,
      slug,
      status
    }
  });
}));

/**
 * @swagger
 * /api/cms/articles/{id}:
 *   get:
 *     summary: Get specific article
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 content:
 *                   type: string
 *                 status:
 *                   type: string
 *                 category:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 author:
 *                   type: string
 *                 publishedAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/articles/:id', requirePermission(['cms:read']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const articleQuery = `
    SELECT 
      id,
      title,
      slug,
      content,
      status,
      category,
      tags,
      author,
      published_at,
      updated_at,
      created_at
    FROM cms_articles
    WHERE id = $1
  `;

  const result = await query(articleQuery, [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Article');
  }

  const article = result.rows[0];
  
  res.json({
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    status: article.status,
    category: article.category,
    tags: article.tags ? JSON.parse(article.tags) : [],
    author: article.author,
    publishedAt: article.published_at,
    updatedAt: article.updated_at
  });
}));

/**
 * @swagger
 * /api/cms/articles/{id}:
 *   put:
 *     summary: Update article
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
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
 *               status:
 *                 type: string
 *                 enum: [published, draft, archived]
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 article:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     status:
 *                       type: string
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
router.put('/articles/:id', requirePermission(['cms:write']), [
  body('title').optional().isString().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1-200 characters'),
  body('content').optional().isString().isLength({ min: 1 }).withMessage('Content is required'),
  body('status').optional().isIn(['published', 'draft', 'archived']).withMessage('Invalid status'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { id } = req.params;
  const { title, content, status, category, tags } = req.body;

  // Check if article exists
  const existingArticle = await query(
    'SELECT id, status FROM cms_articles WHERE id = $1',
    [id]
  );

  if (existingArticle.rows.length === 0) {
    throw new NotFoundError('Article');
  }

  // Build update query
  const updateFields = [];
  const updateValues = [];
  let paramCount = 0;

  if (title !== undefined) {
    paramCount++;
    updateFields.push(`title = $${paramCount}`);
    updateValues.push(title);
  }

  if (content !== undefined) {
    paramCount++;
    updateFields.push(`content = $${paramCount}`);
    updateValues.push(content);
  }

  if (status !== undefined) {
    paramCount++;
    updateFields.push(`status = $${paramCount}`);
    updateValues.push(status);
    
    // Set published_at if status is changing to published
    if (status === 'published') {
      paramCount++;
      updateFields.push(`published_at = NOW()`);
    }
  }

  if (category !== undefined) {
    paramCount++;
    updateFields.push(`category = $${paramCount}`);
    updateValues.push(category);
  }

  if (tags !== undefined) {
    paramCount++;
    updateFields.push(`tags = $${paramCount}`);
    updateValues.push(JSON.stringify(tags));
  }

  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  paramCount++;
  updateFields.push(`updated_at = NOW()`);
  updateValues.push(id);

  const updateQuery = `
    UPDATE cms_articles 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, title, status
  `;

  const result = await query(updateQuery, updateValues);
  const updatedArticle = result.rows[0];

  res.json({
    message: 'Article updated successfully',
    article: {
      id: updatedArticle.id,
      title: updatedArticle.title,
      status: updatedArticle.status
    }
  });
}));

/**
 * @swagger
 * /api/cms/articles/{id}:
 *   delete:
 *     summary: Delete article
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: Article deleted successfully
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
router.delete('/articles/:id', requirePermission(['cms:write']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if article exists
  const articleResult = await query(
    'SELECT id FROM cms_articles WHERE id = $1',
    [id]
  );

  if (articleResult.rows.length === 0) {
    throw new NotFoundError('Article');
  }

  // Delete article
  await query('DELETE FROM cms_articles WHERE id = $1', [id]);

  res.json({
    message: 'Article deleted successfully'
  });
}));

/**
 * @swagger
 * /api/cms/categories:
 *   get:
 *     summary: Get CMS categories
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of CMS categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/categories', requirePermission(['cms:read']), asyncHandler(async (req, res) => {
  const categoriesQuery = `
    SELECT 
      category as name,
      COUNT(*) as count
    FROM cms_articles
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `;

  const result = await query(categoriesQuery);
  
  const categories = result.rows.map(category => ({
    name: category.name,
    count: parseInt(category.count)
  }));

  res.json({ categories });
}));

module.exports = router;






