/**
 * @swagger
 * components:
 *   schemas:
 *     NotFoundError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Route not found"
 *         code:
 *           type: string
 *           example: "NOT_FOUND"
 *         path:
 *           type: string
 *           example: "/api/invalid-route"
 */

const notFound = (req, res, next) => {
  const error = {
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  res.status(404).json(error);
};

module.exports = notFound;