# Upstar Backend API

A comprehensive backend API for the Upstar resume processing and job matching platform.

## Features

- **User Management**: Complete user CRUD operations with role-based access control
- **Resume Processing**: AI-powered resume parsing and skill extraction
- **Job Matching**: Intelligent job recommendations based on user skills
- **Analytics**: Comprehensive analytics and reporting
- **Payments**: Subscription and transaction management
- **AI Settings**: Configurable AI model management
- **System Health**: Real-time system monitoring and alerts
- **Notifications**: Multi-channel notification system
- **CMS**: Content management system for articles and documentation

## Technology Stack

- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL 16
- **Cache**: Redis
- **Authentication**: Auth0 integration
- **File Storage**: AWS S3
- **AI Processing**: OpenAI GPT-4, custom AI models
- **Background Jobs**: Bull Queue with Redis
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd upstar-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Initialize the database
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/api/health`

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=upstar_db
DB_USER=postgres
DB_PASSWORD=localpass

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_SECRET=your-client-secret

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# AWS Configuration (for file storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

## API Routes

### Authentication
- `POST /api/auth/verify` - Verify authentication token
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/check-permission` - Check user permissions

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview metrics
- `GET /api/dashboard/analytics-report` - Generate analytics report

### Users
- `GET /api/users` - Get all users with filtering
- `PATCH /api/users` - Update user information
- `GET /api/users/:id` - Get specific user details
- `POST /api/users/:id/login-as` - Generate login token for admin

### Resumes
- `GET /api/resumes` - Get all resumes with processing status
- `GET /api/resumes/:id` - Get specific resume details
- `POST /api/resumes/:id/reprocess` - Trigger resume reprocessing
- `GET /api/resumes/:id/download` - Download resume file

### Skills
- `GET /api/skills/analytics` - Get skills analytics
- `GET /api/skills/errors` - Get parsing errors
- `GET /api/skills/categories` - Get skills categories
- `GET /api/skills/trends` - Get skills trends

### Jobs
- `GET /api/jobs` - Get job listings with filtering
- `GET /api/jobs/:id` - Get specific job details
- `POST /api/jobs/sync` - Trigger job data synchronization
- `GET /api/jobs/analytics` - Get job analytics

### Analytics
- `GET /api/analytics/skill-analysis` - Get skill gap analysis
- `GET /api/analytics/market-trends` - Get market trends
- `GET /api/analytics/job-performance` - Get job performance metrics
- `GET /api/analytics/geographic` - Get geographic distribution
- `GET /api/analytics/user-engagement` - Get user engagement metrics

### Payments
- `GET /api/payments/subscriptions` - Get subscription data
- `GET /api/payments/transactions` - Get transaction history
- `GET /api/payments/analytics` - Get payment analytics
- `POST /api/payments/refunds` - Process refunds

### AI Settings
- `GET /api/ai/settings` - Get AI configuration settings
- `PUT /api/ai/settings` - Update AI settings
- `GET /api/ai/models/status` - Get AI model status
- `POST /api/ai/models/:modelId/test` - Test AI model
- `GET /api/ai/performance` - Get AI performance metrics

### System Health
- `GET /api/system/health` - Get system health metrics
- `GET /api/system/activity` - Get recent system activity
- `GET /api/system/alerts` - Get system alerts
- `POST /api/system/alerts/:alertId/resolve` - Resolve system alert
- `GET /api/system/metrics` - Get detailed system metrics

### Notifications
- `GET /api/notifications/history` - Get notification history
- `POST /api/notifications/send` - Send notification to users
- `GET /api/notifications/reminders` - Get automated reminders
- `POST /api/notifications/reminders` - Create new reminder
- `POST /api/notifications/reminders/:reminderId/toggle` - Toggle reminder
- `GET /api/notifications/templates` - Get notification templates

### CMS
- `GET /api/cms/articles` - Get CMS articles
- `POST /api/cms/articles` - Create new article
- `GET /api/cms/articles/:id` - Get specific article
- `PUT /api/cms/articles/:id` - Update article
- `DELETE /api/cms/articles/:id` - Delete article
- `GET /api/cms/categories` - Get CMS categories

## Database Schema

The database includes the following main tables:

- **users** - User accounts and profiles
- **skills** - Skills database with market data
- **user_skills** - User skill associations
- **resumes** - Resume files and processing status
- **jobs** - Job listings and details
- **user_job_matches** - Job matching results
- **payments** - Payment transactions
- **subscriptions** - User subscriptions
- **notifications** - Notification history
- **cms_articles** - CMS content
- **system_*** - System health and monitoring tables

## Background Jobs

The system uses Bull Queue for background job processing:

- **Resume Processing** - Extract skills and experience from resumes
- **Job Matching** - Match users with relevant jobs
- **Email Notifications** - Send scheduled emails
- **Data Sync** - Sync external job data
- **Analytics** - Generate reports

## Authentication & Authorization

The API uses Auth0 for authentication with role-based access control:

- **Admin** - Full access to all routes
- **Moderator** - Limited access to user management
- **User** - Read-only access to own data

Permissions are checked for each route using middleware.

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication**: 5 requests/minute
- **Data Retrieval**: 100 requests/minute
- **Data Modification**: 20 requests/minute
- **AI Processing**: 10 requests/minute

## Error Handling

The API provides comprehensive error handling with:

- Standardized error responses
- Detailed error logging
- Graceful error recovery
- User-friendly error messages

## Monitoring & Logging

- **Health Checks** - System health monitoring
- **Metrics Collection** - Performance metrics
- **Request Logging** - All API requests logged
- **Error Logging** - Detailed error information
- **Audit Logging** - User actions and changes

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t upstar-backend .

# Run the container
docker run -p 3000:3000 --env-file .env upstar-backend
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code
npm run format
```

## Production Deployment

### Environment Setup

1. Set up production environment variables
2. Configure database connection
3. Set up Redis instance
4. Configure Auth0
5. Set up AWS S3 for file storage
6. Configure monitoring and logging

### Security Considerations

- Use HTTPS in production
- Configure proper CORS settings
- Set up rate limiting
- Use environment variables for secrets
- Regular security updates
- Database connection encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- Complete API implementation
- Authentication and authorization
- Resume processing and job matching
- Analytics and reporting
- System monitoring
- Background job processing