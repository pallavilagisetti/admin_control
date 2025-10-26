# Upstar Backend Structure and Routes Documentation

## Overview
This document provides a comprehensive backend structure and API routes documentation for the Upstar platform, covering all frontend pages and components identified in the admin dashboard.

## Backend Architecture

### Technology Stack
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL 16
- **Authentication**: Auth0 integration
- **File Storage**: AWS S3
- **AI Processing**: OpenAI GPT-4, custom AI models
- **Background Jobs**: Bull Queue with Redis
- **Monitoring**: Custom health checks and metrics

### Project Structure
```
upstar-backend/
├── src/
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/              # Database models
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── jobs/                # Background job processors
│   ├── config/              # Configuration files
│   └── server.js            # Main server file
├── database/
│   ├── migrations/          # Database migrations
│   └── seeds/              # Database seeders
├── tests/                   # Test files
└── docs/                   # Documentation
```

## API Routes by Frontend Page

### 1. Dashboard Routes (`/`)

#### GET `/api/dashboard/overview`
**Purpose**: Get dashboard overview metrics and KPIs
**Response**:
```json
{
  "summary": {
    "totalUsers": 1234,
    "activeUsers": 567,
    "totalResumes": 2456,
    "totalJobs": 890,
    "revenue": 12345,
    "userSatisfaction": 94
  },
  "metrics": {
    "userGrowth": {
      "current": 1234,
      "previous": 1100,
      "growth": 12.2
    },
    "revenue": {
      "current": 12345,
      "previous": 10800,
      "growth": 14.3
    },
    "systemHealth": {
      "aiProcessing": 98,
      "database": 95,
      "apiResponse": 87,
      "userSatisfaction": 94
    }
  },
  "activities": [
    {
      "type": "User Registration",
      "count": 45,
      "timestamp": "2 hours ago"
    }
  ]
}
```

#### GET `/api/dashboard/analytics-report`
**Purpose**: Generate comprehensive analytics report
**Response**: CSV/PDF report download

### 2. Users Management Routes (`/users`)

#### GET `/api/users`
**Purpose**: Get all users with filtering and pagination
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `search`: Search by name or email
- `status`: Filter by active/inactive status
- `role`: Filter by user role

**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "active": true,
      "roles": ["user"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "pages": 25
  }
}
```

#### PATCH `/api/users`
**Purpose**: Update user information
**Body**:
```json
{
  "id": "uuid",
  "roles": ["admin"],
  "active": true
}
```

#### GET `/api/users/:id`
**Purpose**: Get specific user details
**Response**:
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "active": true,
  "roles": ["user"],
  "profile": {
    "tier": "free",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  },
  "resumes": 3,
  "matchedJobs": 45,
  "assessments": 1
}
```

#### POST `/api/users/:id/login-as`
**Purpose**: Generate login token for admin to login as user
**Response**:
```json
{
  "loginToken": "jwt_token",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

### 3. Resumes Management Routes (`/resumes`)

#### GET `/api/resumes`
**Purpose**: Get all resumes with processing status
**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by processing status
- `userId`: Filter by user ID

**Response**:
```json
{
  "resumes": [
    {
      "id": "uuid",
      "userId": "uuid",
      "filename": "resume.pdf",
      "fileSize": 1024000,
      "fileType": "application/pdf",
      "processingStatus": "COMPLETED",
      "uploadedAt": "2024-01-01T00:00:00Z",
      "processedAt": "2024-01-01T00:02:00Z",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2456,
    "pages": 50
  }
}
```

#### GET `/api/resumes/:id`
**Purpose**: Get specific resume details and parsed data
**Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "filename": "resume.pdf",
  "processingStatus": "COMPLETED",
  "extractedText": "Full text content...",
  "structuredData": {
    "skills": ["JavaScript", "React", "Node.js"],
    "education": "Bachelor's in Computer Science",
    "experience": "5 years software development"
  },
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/resumes/:id/reprocess`
**Purpose**: Trigger reprocessing of a resume
**Response**:
```json
{
  "message": "Resume queued for reprocessing",
  "jobId": "uuid"
}
```

### 4. Skills Analytics Routes (`/skills`)

#### GET `/api/skills/analytics`
**Purpose**: Get skills analytics and insights
**Response**:
```json
{
  "metrics": {
    "skillsTracked": 2847,
    "activeUsers": 9742,
    "marketDemand": 87.3,
    "avgGrowth": 16.8
  },
  "topSkills": [
    {
      "skill": "JavaScript",
      "count": 1234,
      "growth": "+15%"
    }
  ],
  "topMissing": [
    {
      "skill": "Machine Learning",
      "count": 234,
      "gap": 45
    }
  ],
  "experienceLevels": [
    {
      "level": "Expert (8-10 years)",
      "count": 1247,
      "percentage": 12.8
    }
  ],
  "skillDevelopmentTrends": [
    {
      "category": "Technical Skills",
      "learners": 7834,
      "growth": "+24%"
    }
  ]
}
```

#### GET `/api/skills/errors`
**Purpose**: Get parsing errors and failed extractions
**Response**:
```json
{
  "errors": [
    {
      "resumeId": "uuid",
      "userId": "uuid",
      "error": "Failed to extract skills",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 5. Jobs Management Routes (`/jobs`)

#### GET `/api/jobs`
**Purpose**: Get job listings with filtering
**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `search`: Search in title/description
- `location`: Filter by location
- `employmentType`: Filter by employment type
- `remote`: Filter remote jobs
- `datePosted`: Filter by posting date

**Response**:
```json
{
  "jobs": [
    {
      "id": "external_job_id",
      "title": "Senior Software Engineer",
      "organization": "Tech Corp",
      "location": "San Francisco, CA",
      "employmentType": ["FULL_TIME"],
      "remote": true,
      "datePosted": "2024-01-01T00:00:00Z",
      "description": "Job description...",
      "salary": {
        "min": 120000,
        "max": 180000,
        "currency": "USD"
      },
      "skills": ["JavaScript", "React", "Node.js"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 890,
    "pages": 18
  }
}
```

#### GET `/api/jobs/:id`
**Purpose**: Get specific job details
**Response**:
```json
{
  "id": "external_job_id",
  "title": "Senior Software Engineer",
  "organization": "Tech Corp",
  "description": "Full job description...",
  "requirements": "Job requirements...",
  "benefits": ["Health insurance", "401k"],
  "applicationUrl": "https://company.com/apply",
  "matchedUsers": 45,
  "matchScore": 89.2
}
```

#### POST `/api/jobs/sync`
**Purpose**: Trigger job data synchronization
**Response**:
```json
{
  "message": "Job sync initiated",
  "syncId": "uuid"
}
```

### 6. Analytics Routes (`/analytics`)

#### GET `/api/analytics/skill-analysis`
**Purpose**: Get skill gap analysis and trends
**Response**:
```json
{
  "gaps": [
    {
      "name": "React",
      "score": 85,
      "tag": "High"
    }
  ],
  "emerging": [
    {
      "name": "AI/ML",
      "growth": "+245%",
      "requests": 1847
    }
  ]
}
```

#### GET `/api/analytics/market-trends`
**Purpose**: Get market trends and demand data
**Response**:
```json
{
  "trends": [
    {
      "skill": "Artificial Intelligence",
      "demand": 95,
      "growth": "+34%",
      "salary": "$125k"
    }
  ]
}
```

#### GET `/api/analytics/job-performance`
**Purpose**: Get job recommendation performance metrics
**Response**:
```json
{
  "clickThroughRate": {
    "value": "12.8%",
    "change": "+2.3%",
    "positive": true
  },
  "applicationRate": {
    "value": "8.4%",
    "change": "+1.2%",
    "positive": true
  },
  "interviewSuccess": {
    "value": "34.7%",
    "change": "-0.8%",
    "positive": false
  },
  "jobMatchAccuracy": {
    "value": "89.2%",
    "change": "+5.1%",
    "positive": true
  }
}
```

#### GET `/api/analytics/geographic`
**Purpose**: Get geographic distribution data
**Response**:
```json
{
  "regions": [
    {
      "region": "North America",
      "users": 5847,
      "percentage": 45.5
    }
  ]
}
```

### 7. Payments Routes (`/payments`)

#### GET `/api/payments/subscriptions`
**Purpose**: Get subscription data
**Response**:
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "user": {
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "plan": "Pro",
      "status": "Active",
      "amount": "$19.99",
      "nextBilling": "2024-04-15"
    }
  ]
}
```

#### GET `/api/payments/transactions`
**Purpose**: Get transaction history
**Response**:
```json
{
  "transactions": [
    {
      "id": "txn_1",
      "user": "Alice Johnson",
      "amount": 19.99,
      "status": "Completed",
      "type": "subscription",
      "method": "Visa ****1234",
      "date": "2024-03-15"
    }
  ]
}
```

#### GET `/api/payments/analytics`
**Purpose**: Get payment analytics
**Response**:
```json
{
  "revenue": {
    "monthly": 89420,
    "growth": 23.1
  },
  "subscriptions": {
    "active": 3847,
    "growth": 12.5
  },
  "conversion": {
    "rate": 29.8,
    "growth": 3.2
  },
  "churn": {
    "rate": 4.2,
    "change": -0.8
  }
}
```

### 8. AI Settings Routes (`/ai-settings`)

#### GET `/api/ai/settings`
**Purpose**: Get AI configuration settings
**Response**:
```json
{
  "settings": [
    {
      "id": "confidence_threshold",
      "name": "Confidence Threshold",
      "description": "Minimum confidence score for AI predictions",
      "value": 0.85,
      "type": "slider",
      "category": "Prediction"
    }
  ]
}
```

#### PUT `/api/ai/settings`
**Purpose**: Update AI settings
**Body**:
```json
{
  "settings": [
    {
      "id": "confidence_threshold",
      "value": 0.9
    }
  ]
}
```

#### GET `/api/ai/models/status`
**Purpose**: Get AI model status and performance
**Response**:
```json
{
  "models": [
    {
      "name": "GPT-4",
      "status": "active",
      "performance": {
        "accuracy": 94.2,
        "latency": 1.2,
        "cost": 0.03
      }
    }
  ]
}
```

### 9. System Health Routes (`/system-health`)

#### GET `/api/system/health`
**Purpose**: Get system health metrics
**Response**:
```json
{
  "overall": "healthy",
  "uptime": "99.9%",
  "lastIncident": "2024-01-15T10:30:00Z",
  "activeAlerts": 2,
  "metrics": [
    {
      "label": "AI Processing",
      "value": 95,
      "status": "excellent",
      "trend": "up"
    }
  ]
}
```

#### GET `/api/system/activity`
**Purpose**: Get recent system activity
**Response**:
```json
{
  "activities": [
    {
      "action": "Database backup completed",
      "time": "2 minutes ago",
      "status": "success"
    }
  ]
}
```

### 10. Notifications Routes (`/notifications`)

#### GET `/api/notifications/history`
**Purpose**: Get notification history
**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Welcome to SkillGraph AI Pro!",
      "recipients": 1247,
      "sentAt": "2024-03-20",
      "openRate": "87.3%",
      "status": "Sent"
    }
  ]
}
```

#### POST `/api/notifications/send`
**Purpose**: Send notification to users
**Body**:
```json
{
  "title": "Message Title",
  "content": "Message content",
  "audience": "All Users",
  "schedule": "now"
}
```

#### GET `/api/notifications/reminders`
**Purpose**: Get automated reminders
**Response**:
```json
{
  "reminders": [
    {
      "id": "uuid",
      "title": "Interview Reminder",
      "description": "Sent 3 days before scheduled interviews",
      "cadence": "Event-based",
      "enabled": true
    }
  ]
}
```

#### POST `/api/notifications/reminders`
**Purpose**: Create new reminder
**Body**:
```json
{
  "title": "New Reminder",
  "description": "Reminder description",
  "cadence": "Weekly"
}
```

### 11. CMS Routes (`/cms`)

#### GET `/api/cms/articles`
**Purpose**: Get CMS articles
**Response**:
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "slug": "getting-started",
      "content": "Welcome to our platform...",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/cms/articles`
**Purpose**: Create new article
**Body**:
```json
{
  "title": "New Article",
  "slug": "new-article",
  "content": "Article content..."
}
```

#### PUT `/api/cms/articles/:id`
**Purpose**: Update article
**Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### DELETE `/api/cms/articles/:id`
**Purpose**: Delete article

## Authentication & Authorization

### Auth0 Integration
All routes require authentication via Auth0 JWT tokens.

### Role-Based Access Control
- **Admin**: Full access to all routes
- **Moderator**: Limited access to user management
- **User**: Read-only access to own data

### Permission System
Routes are protected with permission-based middleware:
- `users:read` - Read user data
- `users:write` - Modify user data
- `resumes:read` - Read resume data
- `resumes:write` - Process resumes
- `analytics:read` - View analytics
- `notifications:write` - Send notifications
- `cms:write` - Manage CMS content

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

## Rate Limiting

### Limits by Endpoint
- **Authentication**: 5 requests/minute
- **Data Retrieval**: 100 requests/minute
- **Data Modification**: 20 requests/minute
- **AI Processing**: 10 requests/minute

## Background Jobs

### Job Types
- **Resume Processing**: Extract skills and experience
- **Job Matching**: Match users with jobs
- **Email Notifications**: Send scheduled emails
- **Data Sync**: Sync external job data
- **Analytics**: Generate reports

### Job Queue Endpoints
- `POST /api/jobs/process-resume` - Queue resume processing
- `POST /api/jobs/match-users` - Queue user matching
- `GET /api/jobs/status/:id` - Get job status

## Database Integration

### Connection Pooling
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 10 seconds

### Query Optimization
- **Indexes**: Optimized for common query patterns
- **Caching**: Redis cache for frequently accessed data
- **Pagination**: Efficient pagination for large datasets

## Monitoring & Logging

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

### Metrics Collection
- **Response Times**: Track API performance
- **Error Rates**: Monitor error frequencies
- **Usage Patterns**: Analyze endpoint usage
- **Database Performance**: Monitor query performance

### Logging
- **Request Logging**: All API requests logged
- **Error Logging**: Detailed error information
- **Audit Logging**: User actions and changes
- **Performance Logging**: Slow query detection

## Security

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **HTTPS**: All communications encrypted in transit
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection**: Parameterized queries only

### Access Control
- **JWT Tokens**: Secure token-based authentication
- **Role Verification**: Server-side role validation
- **Permission Checks**: Granular permission system
- **Rate Limiting**: Prevent abuse and DoS attacks

## Deployment

### Environment Configuration
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=resume_db
DB_USER=postgres
DB_PASSWORD=localpass
REDIS_URL=redis://localhost:6379
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Testing

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing
- **Performance Tests**: Load and stress testing

### Test Commands
```bash
npm test              # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e      # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

## API Documentation

### OpenAPI Specification
The complete API specification is available at `/api/docs` when running the server.

### Interactive Documentation
- **Swagger UI**: Available at `/api/docs`
- **Postman Collection**: Available for import
- **API Examples**: Request/response examples provided

## Conclusion

This backend structure provides comprehensive API coverage for all frontend pages and components identified in the admin dashboard. The routes are designed to be RESTful, secure, and scalable, with proper error handling, authentication, and monitoring in place.

The API supports the full functionality of the admin dashboard including user management, resume processing, skills analytics, job management, payments, AI settings, system monitoring, notifications, and CMS operations.

use 
