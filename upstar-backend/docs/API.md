# Upstar Backend API Documentation

## Overview
This document provides comprehensive API documentation for the Upstar backend system.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints require authentication via JWT tokens in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "pagination": { ... } // For paginated responses
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting
- Authentication: 5 requests/minute
- Data Retrieval: 100 requests/minute
- Data Modification: 20 requests/minute
- AI Processing: 10 requests/minute

## Endpoints

### Authentication
- `POST /auth/verify` - Verify authentication token
- `POST /auth/refresh` - Refresh authentication token
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get user profile
- `POST /auth/check-permission` - Check user permissions

### Dashboard
- `GET /dashboard/overview` - Get dashboard overview metrics
- `GET /dashboard/analytics-report` - Generate analytics report

### Users
- `GET /users` - Get all users with filtering
- `PATCH /users` - Update user information
- `GET /users/:id` - Get specific user details
- `POST /users/:id/login-as` - Generate login token for admin

### Resumes
- `GET /resumes` - Get all resumes with processing status
- `GET /resumes/:id` - Get specific resume details
- `POST /resumes/:id/reprocess` - Trigger resume reprocessing
- `GET /resumes/:id/download` - Download resume file

### Skills
- `GET /skills/analytics` - Get skills analytics
- `GET /skills/errors` - Get parsing errors
- `GET /skills/categories` - Get skills categories
- `GET /skills/trends` - Get skills trends

### Jobs
- `GET /jobs` - Get job listings with filtering
- `GET /jobs/:id` - Get specific job details
- `POST /jobs/sync` - Trigger job data synchronization
- `GET /jobs/analytics` - Get job analytics

### Analytics
- `GET /analytics/skill-analysis` - Get skill gap analysis
- `GET /analytics/market-trends` - Get market trends
- `GET /analytics/job-performance` - Get job performance metrics
- `GET /analytics/geographic` - Get geographic distribution
- `GET /analytics/user-engagement` - Get user engagement metrics

### Payments
- `GET /payments/subscriptions` - Get subscription data
- `GET /payments/transactions` - Get transaction history
- `GET /payments/analytics` - Get payment analytics
- `POST /payments/refunds` - Process refunds

### AI Settings
- `GET /ai/settings` - Get AI configuration settings
- `PUT /ai/settings` - Update AI settings
- `GET /ai/models/status` - Get AI model status
- `POST /ai/models/:modelId/test` - Test AI model
- `GET /ai/performance` - Get AI performance metrics

### System Health
- `GET /system/health` - Get system health metrics
- `GET /system/activity` - Get recent system activity
- `GET /system/alerts` - Get system alerts
- `POST /system/alerts/:alertId/resolve` - Resolve system alert
- `GET /system/metrics` - Get detailed system metrics

### Notifications
- `GET /notifications/history` - Get notification history
- `POST /notifications/send` - Send notification to users
- `GET /notifications/reminders` - Get automated reminders
- `POST /notifications/reminders` - Create new reminder
- `POST /notifications/reminders/:reminderId/toggle` - Toggle reminder
- `GET /notifications/templates` - Get notification templates

### CMS
- `GET /cms/articles` - Get CMS articles
- `POST /cms/articles` - Create new article
- `GET /cms/articles/:id` - Get specific article
- `PUT /cms/articles/:id` - Update article
- `DELETE /cms/articles/:id` - Delete article
- `GET /cms/categories` - Get CMS categories

## Examples

### Get Users
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=john" \
  -H "Authorization: Bearer <token>"
```

### Create Article
```bash
curl -X POST "http://localhost:3000/api/cms/articles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Article",
    "slug": "new-article",
    "content": "Article content...",
    "status": "published"
  }'
```

### Send Notification
```bash
curl -X POST "http://localhost:3000/api/notifications/send" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Message",
    "content": "Welcome to our platform!",
    "audience": "All Users",
    "schedule": "now"
  }'
```





