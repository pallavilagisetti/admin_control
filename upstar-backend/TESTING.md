# Upstar Backend Testing Guide

This guide provides comprehensive instructions for testing the Upstar backend API with database integration.

## Prerequisites

Before running tests, ensure you have:

1. **PostgreSQL 16+** running and accessible
2. **Redis 7+** running for job queues
3. **Node.js 18+** installed
4. **All dependencies** installed (`npm install`)
5. **Environment variables** configured in `env.local` file

## Environment Setup

Create an `env.local` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=resume_db
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

# SMTP Configuration (for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@upstar.com
```

## Testing Commands

### 1. Quick Setup and Test

```bash
# Set up database and run all tests
npm run test:all
```

### 2. Individual Test Commands

```bash
# Set up database with migrations and seeds
npm run setup:db

# Test backend services and database
npm run test:backend

# Test API endpoints
npm run test:api

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run all Jest tests with coverage
npm run test:coverage
```

### 3. Database Management

```bash
# Run database migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback migration
npm run migrate:rollback

# Run database seeds
npm run seed

# Check seed status
npm run seed:status

# Reset database (DANGEROUS)
npm run seed:reset
```

## Test Categories

### 1. Database Tests (`test-backend.js`)

Tests the following components:
- ✅ Database connection and queries
- ✅ Database table existence and structure
- ✅ Redis connection and caching
- ✅ Job queue functionality
- ✅ AI service integration
- ✅ S3 service integration
- ✅ Email service configuration
- ✅ API endpoint accessibility
- ✅ Database migrations and seeds
- ✅ Sample data verification
- ✅ Database performance

### 2. API Tests (`test-api.js`)

Tests the following endpoints:
- ✅ Health check endpoints
- ✅ Authentication endpoints
- ✅ User management endpoints
- ✅ Resume processing endpoints
- ✅ Skills analytics endpoints
- ✅ Job management endpoints
- ✅ Analytics endpoints
- ✅ Payment endpoints
- ✅ AI settings endpoints
- ✅ System health endpoints
- ✅ Notification endpoints
- ✅ CMS endpoints
- ✅ File upload endpoints
- ✅ Job queue endpoints

### 3. Unit Tests (`tests/unit/`)

Tests individual components:
- ✅ User controller functions
- ✅ Database models
- ✅ Service functions
- ✅ Utility functions
- ✅ Middleware functions

### 4. Integration Tests (`tests/integration/`)

Tests API workflows:
- ✅ Authentication flow
- ✅ User management workflow
- ✅ Resume processing workflow
- ✅ Job matching workflow
- ✅ Analytics workflow
- ✅ Error handling

### 5. End-to-End Tests (`tests/e2e/`)

Tests complete user journeys:
- ✅ User registration and onboarding
- ✅ Admin dashboard workflow
- ✅ Resume processing workflow
- ✅ Job matching workflow
- ✅ Payment workflow
- ✅ CMS workflow
- ✅ System monitoring workflow

### 6. Performance Tests (`tests/performance/`)

Tests system performance:
- ✅ API response times
- ✅ Concurrent request handling
- ✅ Database performance
- ✅ Memory usage
- ✅ Rate limiting
- ✅ System stability under load

## Expected Test Results

### Successful Test Output

```
🚀 Running Complete Backend Test Suite...

🔍 Running Database Setup...
   Setting up database with migrations and seeds
✅ Database Setup completed successfully

🔍 Running Backend Tests...
   Testing database connections, services, and job queues
✅ Backend Tests completed successfully

🔍 Running API Tests...
   Testing all API endpoints and authentication
✅ API Tests completed successfully

🔍 Running Unit Tests...
   Running unit tests with Jest
✅ Unit Tests completed successfully

🔍 Running Integration Tests...
   Running integration tests
✅ Integration Tests completed successfully

🔍 Running E2E Tests...
   Running end-to-end tests
✅ E2E Tests completed successfully

📊 Complete Test Suite Results:
================================
✅ PASS Database Setup
✅ PASS Backend Tests
✅ PASS API Tests
✅ PASS Unit Tests
✅ PASS Integration Tests
✅ PASS E2E Tests

🎯 Total: 6 passed, 0 failed

🎉 All tests passed! Backend is fully functional and ready for production.
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   ❌ Database connection failed: connect ECONNREFUSED 127.0.0.1:5433
   ```
   **Solution**: Ensure PostgreSQL is running and accessible

2. **Redis Connection Failed**
   ```
   ❌ Redis connection failed: connect ECONNREFUSED 127.0.0.1:6379
   ```
   **Solution**: Ensure Redis is running and accessible

3. **Migration Failed**
   ```
   ❌ Migration failed: relation "users" already exists
   ```
   **Solution**: Check if database is already initialized

4. **Authentication Failed**
   ```
   ❌ AI Service test failed: Invalid API key
   ```
   **Solution**: Check OpenAI API key in environment variables

5. **S3 Connection Failed**
   ```
   ❌ S3 Service test failed: Access Denied
   ```
   **Solution**: Check AWS credentials and S3 bucket permissions

### Environment Issues

1. **Missing Environment Variables**
   - Check `env.local` file exists and has all required variables
   - Verify variable names match the expected format

2. **Database Permissions**
   - Ensure database user has CREATE, INSERT, UPDATE, DELETE permissions
   - Check database exists and is accessible

3. **Redis Configuration**
   - Verify Redis is running on the correct port
   - Check Redis authentication if required

## Manual Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# API documentation
curl http://localhost:3000/api/docs

# System health (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/system/health
```

### 3. Test Database

```bash
# Connect to PostgreSQL
psql -h localhost -p 5433 -U postgres -d resume_db

# Check tables
\dt

# Check sample data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM skills;
SELECT COUNT(*) FROM jobs;
```

### 4. Test Job Queues

```bash
# Check Redis
redis-cli ping

# Monitor job queues
redis-cli monitor
```

## Production Testing

### 1. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### 2. Security Testing

```bash
# Test authentication
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/users

# Test rate limiting
for i in {1..200}; do curl http://localhost:3000/api/health; done
```

### 3. Performance Testing

```bash
# Test database performance
npm run test:performance

# Monitor system resources
htop
```

## Continuous Integration

### GitHub Actions

```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

## Monitoring

### 1. Health Checks

- **Basic Health**: `GET /api/health`
- **Detailed Health**: `GET /api/health/detailed`
- **System Health**: `GET /api/system/health`

### 2. Metrics

- **API Performance**: Response times, error rates
- **Database Performance**: Query times, connection counts
- **Job Queue Status**: Queue lengths, processing times
- **System Resources**: CPU, memory, disk usage

### 3. Logging

- **Request Logs**: All API requests logged
- **Error Logs**: Detailed error information
- **Audit Logs**: User actions and changes
- **Performance Logs**: Slow queries and requests

## Conclusion

The Upstar backend includes comprehensive testing capabilities covering:

- ✅ **Database Integration**: Full PostgreSQL testing
- ✅ **API Endpoints**: All 100+ endpoints tested
- ✅ **Authentication**: Auth0 integration testing
- ✅ **Background Jobs**: Bull Queue with Redis testing
- ✅ **External Services**: AI, S3, Email service testing
- ✅ **Performance**: Load and stress testing
- ✅ **Security**: Authentication and authorization testing

The backend is production-ready with full test coverage and monitoring capabilities.






