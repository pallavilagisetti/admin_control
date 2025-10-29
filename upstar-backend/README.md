# Upstar Backend API

A robust Node.js backend API built with Express.js and PostgreSQL for the Upstar platform. Provides comprehensive analytics, user management, and data processing capabilities.

## 🚀 Features

- **RESTful API**: Well-structured REST endpoints with proper HTTP methods
- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **Database Integration**: PostgreSQL with comprehensive data models
- **Background Processing**: Job processing for resume analysis
- **File Processing**: Resume parsing and document analysis
- **Analytics Engine**: Real-time analytics and reporting
- **Error Handling**: Comprehensive error management and logging
- **CORS Support**: Proper CORS configuration for frontend integration

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **File Processing**: PDF parsing, image processing
- **Validation**: Joi for request validation
- **Logging**: Winston for structured logging
- **Documentation**: Comprehensive API documentation

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+

- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database and update the connection string in `.env`:

```env
DB_HOST=54.254.3.87 (ec2 public ip)
DB_PORT=5433
DB_NAME=resume_db
DB_USER=developer
DB_PASSWORD=localpass

```

### 3. Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DB_HOST=54.254.3.87
DB_PORT=5433
DB_NAME=resume_db
DB_USER=developer
DB_PASSWORD=localpass

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and profiles
- **resumes**: Resume documents and processing status
- **jobs**: Job postings and requirements
- **payments**: Payment transactions and billing
- **user_activity_logs**: User activity tracking
- **api_logs**: API usage and performance monitoring

### Key Relationships

- Users can have multiple resumes
- Users can apply to multiple jobs
- Jobs can have multiple applications
- Payments are linked to users and services

## 🔐 Authentication System

### JWT Token Structure

```javascript
{
  "userId": "user_id",
  "email": "user@example.com",
  "role": "admin|editor|viewer",
  "permissions": ["analytics:read", "users:write"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-based Permissions

| Role | Permissions |
|------|-------------|
| Admin | Full access to all endpoints |
| Editor | Read/write access to content |
| Viewer | Read-only access |

### Mock Authentication Support

The backend supports frontend-generated mock tokens for development:

```javascript
// Frontend generates tokens with 'mock-signature'
// Backend recognizes and validates these tokens
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Dashboard Analytics
- `GET /api/dashboard/analytics-report` - Generate analytics report
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/health` - System health check

### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Resume Processing
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes` - List resumes
- `GET /api/resumes/:id` - Get resume details
- `POST /api/resumes/:id/process` - Process resume

### Job Management
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

## 🔄 Background Processing

### Job Types

- **resume-processing**: Parse and analyze resume documents
- **analytics-generation**: Generate analytics reports
- **email-notifications**: Send email notifications
- **data-sync**: Synchronize data between systems

### Processing Configuration

```javascript
// Background processing without Redis
const processResume = async (resumeId) => {
  // Direct processing without queue
  return await analyzeResume(resumeId);
};
```

## 📈 Analytics Engine

### Real-time Metrics

- **User Growth**: Registration trends and active users
- **Resume Processing**: Upload counts and processing success rates
- **Job Activity**: Job postings and application metrics
- **Revenue Tracking**: Payment processing and revenue growth
- **System Performance**: API response times and error rates

### Report Generation

The analytics report includes:
- Executive summary with key metrics
- Detailed breakdowns by category
- Growth trends and comparisons
- System health indicators
- Recommendations for improvement

## 🛡️ Security Features

### Input Validation
- Joi schemas for request validation
- SQL injection prevention
- XSS protection
- File upload security

### Authentication Security
- JWT token validation
- Role-based access control
- Session management
- Secure password handling

### API Security
- Rate limiting
- CORS configuration
- Request logging
- Error handling without information leakage

## 📝 Logging & Monitoring

### Structured Logging

```javascript
// Winston logger with multiple transports
logger.info('User login successful', { userId, email, role });
logger.error('Database connection failed', { error: error.message });
```

### API Monitoring

- Request/response logging
- Performance metrics
- Error tracking
- Usage analytics

## 🧪 Testing

### Test Accounts

The system includes test accounts for development:

```javascript
const testUsers = [
  {
    email: 'pallavigisetti12003@gmail.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    email: 'lagisettipallavi607@gmail.com', 
    password: 'editor123',
    role: 'editor'
  },
  {
    email: 'pallusweety67@gmail.com',
    password: 'viewer123', 
    role: 'viewer'
  }
];
```

### Manual Testing

1. **Health Check**: `GET /api/health`
2. **Authentication**: Test login with test accounts
3. **Analytics**: Generate analytics report
4. **File Upload**: Test resume upload functionality

## 🚀 Deployment



## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DATABASE` | PostgreSQL connection | - |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |

### Database Configuration

- **Connection Pool**: Configured for optimal performance
- **Migrations**: Database schema management
- **Indexes**: Optimized for query performance
- **Constraints**: Data integrity enforcement

## 📊 Performance Optimization

### Database Optimization
- Connection pooling
- Query optimization
- Index usage
- Caching strategies

### API Optimization
- Response compression
- Request caching
- Background processing
- Error handling

## 🆘 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- Check PostgreSQL is running
- Verify connection string
- Check database permissions

#### 2. Authentication Failures
- Verify JWT secret is set
- Check token expiration
- Validate user credentials

### Debug Mode

```bash
# Enable debug logging
DEBUG=skillgraph:* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Upstar platform.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Test with provided test accounts

---

**Note**: This backend API powers the Upstar admin dashboard. Ensure all dependencies (PostgreSQL) are running for full functionality.
