# Upstar Admin Panel - Complete End-to-End Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Dashboard Sections & Use Cases](#dashboard-sections--use-cases)
5. [API Endpoints & Data Flow](#api-endpoints--data-flow)
6. [Database Schema & Tables](#database-schema--tables)
7. [Authentication & Security](#authentication--security)
8. [Deployment & Environment](#deployment--environment)
9. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
10. [Future Enhancements](#future-enhancements)

---

## 🎯 System Overview

### What is Upstar Admin Panel?
The Upstar Admin Panel is a comprehensive web-based administration system designed to manage a resume processing and job matching platform. It provides administrators with complete control over users, job listings, resume processing, analytics, and system operations.

### Core Purpose
- **Resume Processing Management**: Handle user resume uploads, parsing, and AI-powered analysis
- **Job Listing Management**: Manage job postings, applications, and matching algorithms
- **User Management**: Oversee user accounts, subscriptions, and permissions
- **Analytics & Reporting**: Generate insights on platform usage, performance, and trends
- **System Monitoring**: Monitor system health, performance, and operational metrics

### Key Features
- Real-time dashboard with live metrics
- Comprehensive user management system
- Advanced job listing management
- Resume processing pipeline
- Analytics and reporting tools
- System health monitoring
- AI model configuration
- Content management system
- Notification system
- Payment and subscription management

---

## 🏗️ Architecture & Technology Stack

### Frontend (upstar-website)
- **Framework**: Next.js 14.2.5 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useContext)
- **API Integration**: Custom API client with React hooks
- **Authentication**: JWT-based authentication with Auth0 integration


### Backend (upstar-backend)
- **Runtime**: Node.js with Express.js
- **Language**: JavaScript
- **Database**: AWS Cloud DB (EC2 -public ip)
- **Authentication**: JWT middleware with role-based access control
- **API**: RESTful API with comprehensive error handling


### Database
- **Primary Database**: AWS Cloud DB (EC2 -public ip)
- **Tables**: 15+ tables including users, resumes, job_listings, payments, etc.
- **Connection**: Pool-based connections with SSL support
- **Environment**: Development (local) and Production (Render)

---

## 👥 User Roles & Permissions

### 1. **Super Admin**
- **Full System Access**: Complete control over all features
- **User Management**: Create, modify, delete any user account
- **System Configuration**: Modify system settings, AI models, and configurations
- **Financial Access**: View and manage all payments, subscriptions, and revenue
- **Analytics**: Access to all analytics and reporting features

**Permissions:**
```
users:read, users:write, users:delete
resumes:read, resumes:write, resumes:delete
jobs:read, jobs:write, jobs:delete
analytics:read, analytics:write
payments:read, payments:write
ai:read, ai:write
system:read, system:write
notifications:read, notifications:write
cms:read, cms:write
files:write
```

### 2. **Admin**
- **User Management**: Manage user accounts and permissions
- **Content Management**: Handle job listings and resume processing
- **Analytics**: Access to platform analytics and reports
- **System Monitoring**: Monitor system health and performance

**Permissions:**
```
users:read, users:write
resumes:read, resumes:write
jobs:read, jobs:write
analytics:read
payments:read
system:read
notifications:read, notifications:write
cms:read, cms:write
```

### 3. **Moderator**
- **Content Review**: Review and moderate job listings and resumes
- **User Support**: Handle user inquiries and support requests
- **Basic Analytics**: Access to basic reporting features

**Permissions:**
```
users:read
resumes:read
jobs:read
analytics:read
notifications:read, notifications:write
```

### 4. **Viewer**
- **Read-Only Access**: View system data without modification rights
- **Basic Reports**: Access to basic analytics and reports

**Permissions:**
```
users:read
resumes:read
jobs:read
analytics:read
```

---

## 📊 Dashboard Sections & Use Cases

### 1. **Dashboard Overview** (`/dashboard`)
**Purpose**: Central command center providing real-time system metrics and insights.

**Key Metrics Displayed:**
- **Total Users**: Current registered users (8 users)
- **Active Users**: Users active in last 30 days (8 users)
- **Total Resumes**: Processed resumes (13 resumes)
- **Total Jobs**: Available job listings (4,900 jobs)
- **Revenue**: Total platform revenue ($499.95)
- **User Satisfaction**: Platform satisfaction score (94%)

**Use Cases:**
- **Daily Monitoring**: Check system health and user activity
- **Performance Tracking**: Monitor growth metrics and KPIs
- **Quick Overview**: Get instant snapshot of platform status
- **Trend Analysis**: View growth percentages and trends

**Real-time Features:**
- Live user statistics
- Recent activity feed
- System health indicators
- Revenue tracking
- Growth metrics

### 2. **Users Management** (`/users`)
**Purpose**: Comprehensive user account management and administration.

**Key Features:**
- **User List**: Paginated list of all registered users
- **Search & Filter**: Find users by name, email, status, or role
- **User Details**: View complete user profiles and activity
- **Account Actions**: Activate, deactivate, or modify user accounts
- **Login As User**: Impersonate users for support purposes
- **Subscription Management**: View and manage user subscription tiers

**Use Cases:**
- **Customer Support**: Help users with account issues
- **Account Management**: Modify user permissions and settings
- **User Analytics**: Track user behavior and engagement
- **Subscription Handling**: Manage premium subscriptions
- **Security**: Monitor suspicious user activity

**Data Displayed:**
- User ID, Name, Email
- Account Status (Active/Inactive)
- Subscription Tier (Free/Pro/Enterprise)
- Registration Date
- Last Login
- Resume Count
- Job Matches

### 3. **Jobs Management** (`/jobs`)
**Purpose**: Complete job listing management and optimization.

**Key Features:**
- **Job Listings**: 4,900+ job postings with search and pagination
- **Job Details**: Comprehensive job information including salary, location, requirements
- **Job Actions**: Activate, pause, close, or delete job listings
- **Search & Filter**: Find jobs by title, company, location, or type
- **Analytics**: Job performance metrics and application tracking
- **Bulk Operations**: Manage multiple jobs simultaneously

**Use Cases:**
- **Job Posting Management**: Add, edit, or remove job listings
- **Quality Control**: Review and moderate job postings
- **Performance Tracking**: Monitor job application rates
- **Market Analysis**: Analyze job market trends and demands
- **Employer Relations**: Manage relationships with job posters

**Data Displayed:**
- Job Title and Organization
- Location and Remote Status
- Salary Range and Currency
- Employment Type
- Posted Date
- Application URL
- Required Skills

### 4. **Resumes Management** (`/resumes`)
**Purpose**: Resume processing pipeline and file management.

**Key Features:**
- **Resume Processing**: AI-powered resume parsing and analysis
- **File Management**: Upload, download, and manage resume files
- **Processing Status**: Track resume processing stages
- **Quality Control**: Review and validate processed resumes
- **Reprocessing**: Re-process failed or incomplete resumes
- **User Matching**: Match resumes with relevant job opportunities

**Use Cases:**
- **Processing Pipeline**: Monitor resume processing workflow
- **Quality Assurance**: Ensure accurate resume parsing
- **User Support**: Help users with resume upload issues
- **Data Extraction**: Extract structured data from resumes
- **Job Matching**: Improve job-resume matching algorithms

**Processing Stages:**
- Upload → Parsing → Analysis → Validation → Completion
- Error handling and retry mechanisms
- Progress tracking and notifications

### 5. **Skills Analytics** (`/skills`)
**Purpose**: Skills analysis and market trend insights.

**Key Features:**
- **Skills Analytics**: Analyze skill trends and demands
- **Error Tracking**: Monitor skills extraction errors
- **Category Management**: Organize skills by categories
- **Trend Analysis**: Track skill popularity over time
- **Market Insights**: Understand skill market dynamics

**Use Cases:**
- **Market Research**: Understand skill demands
- **Algorithm Improvement**: Enhance skills extraction
- **User Guidance**: Help users identify valuable skills
- **Industry Analysis**: Track industry skill trends

### 6. **System Health** (`/system-health`)
**Purpose**: Monitor system performance and operational health.

**Key Features:**
- **Performance Metrics**: API response times, database performance
- **System Alerts**: Real-time system alerts and notifications
- **Incident Tracking**: Monitor and resolve system incidents
- **Resource Monitoring**: CPU, memory, and storage usage
- **Uptime Tracking**: System availability and reliability metrics

**Use Cases:**
- **Proactive Monitoring**: Prevent system issues before they occur
- **Incident Response**: Quickly identify and resolve problems
- **Performance Optimization**: Improve system performance
- **Capacity Planning**: Plan for future system needs

### 7. **AI Settings** (`/ai-settings`)
**Purpose**: Configure and manage AI models and processing parameters.

**Key Features:**
- **Model Configuration**: Adjust AI model parameters
- **Performance Monitoring**: Track AI model performance
- **Cost Management**: Monitor AI processing costs
- **Model Testing**: Test different AI models and configurations
- **Accuracy Tracking**: Monitor model accuracy and improvements

**Use Cases:**
- **Model Optimization**: Improve AI model performance
- **Cost Control**: Manage AI processing expenses
- **Quality Improvement**: Enhance resume parsing accuracy
- **Experimentation**: Test new AI approaches

### 8. **Content Management** (`/cms`)
**Purpose**: Manage platform content and documentation.

**Key Features:**
- **Article Management**: Create and manage help articles
- **Content Publishing**: Publish and schedule content
- **Category Organization**: Organize content by categories
- **Version Control**: Track content changes and versions
- **SEO Management**: Optimize content for search engines

**Use Cases:**
- **User Support**: Provide help documentation
- **Marketing Content**: Manage promotional content
- **Knowledge Base**: Maintain platform knowledge base
- **Content Strategy**: Plan and execute content strategy

### 9. **Notifications** (`/notifications`)
**Purpose**: Manage user communications and notifications.

**Key Features:**
- **Notification History**: Track all sent notifications
- **Template Management**: Create and manage notification templates
- **User Targeting**: Send notifications to specific user groups
- **Reminder System**: Set up automated reminders
- **Delivery Tracking**: Monitor notification delivery status

**Use Cases:**
- **User Engagement**: Keep users informed and engaged
- **Marketing Campaigns**: Send promotional notifications
- **System Updates**: Notify users of platform changes
- **Support Communication**: Send support-related messages

### 10. **Payments & Subscriptions** (`/payments`)
**Purpose**: Manage financial transactions and subscription plans.

**Key Features:**
- **Payment Processing**: Handle payment transactions
- **Subscription Management**: Manage user subscription plans
- **Revenue Analytics**: Track revenue and financial metrics
- **Refund Processing**: Handle refund requests
- **Billing Management**: Manage billing cycles and invoicing

**Use Cases:**
- **Revenue Management**: Track and optimize revenue
- **Customer Billing**: Handle subscription billing
- **Financial Reporting**: Generate financial reports
- **Payment Support**: Resolve payment issues

---

## 🔌 API Endpoints & Data Flow

### Core API Endpoints

#### Dashboard APIs
```
GET /api/dashboard/overview
- Returns: User stats, revenue, system health metrics
- Use Case: Dashboard overview data

GET /api/dashboard/analytics-report
- Returns: Comprehensive analytics report
- Use Case: Generate detailed reports
```

#### User Management APIs
```
GET /api/users
- Parameters: page, limit, search, status, role
- Returns: Paginated user list with details
- Use Case: User management interface

GET /api/users/:id
- Returns: Specific user details
- Use Case: User profile view

PUT /api/users/:id
- Body: User update data
- Returns: Updated user information
- Use Case: Modify user accounts

POST /api/users/:id/login-as
- Returns: Temporary login token
- Use Case: User impersonation for support
```

#### Job Management APIs
```
GET /api/jobs
- Parameters: page, limit, search, location, remote
- Returns: Paginated job listings (4,900+ jobs)
- Use Case: Job management interface

GET /api/jobs/:id
- Returns: Specific job details
- Use Case: Job detail view

POST /api/jobs/sync
- Returns: Sync status
- Use Case: Synchronize job data

GET /api/jobs/analytics
- Returns: Job performance analytics
- Use Case: Job analytics dashboard
```

#### Resume Management APIs
```
GET /api/resumes
- Parameters: page, limit, search, status, userId
- Returns: Paginated resume list
- Use Case: Resume management interface

GET /api/resumes/:id
- Returns: Specific resume details
- Use Case: Resume detail view

POST /api/resumes/:id/reprocess
- Returns: Processing status
- Use Case: Reprocess failed resumes

GET /api/resumes/:id/download
- Returns: Resume file
- Use Case: Download resume files
```

#### Skills Analytics APIs
```
GET /api/skills/analytics
- Returns: Skills analytics data
- Use Case: Skills dashboard

GET /api/skills/errors
- Parameters: page, limit
- Returns: Skills extraction errors
- Use Case: Error monitoring

GET /api/skills/categories
- Returns: Skills categories
- Use Case: Skills organization

GET /api/skills/trends
- Returns: Skills trend data
- Use Case: Market analysis
```

#### System Health APIs
```
GET /api/system/health
- Returns: System health metrics
- Use Case: Health monitoring

GET /api/system/activity
- Returns: System activity logs
- Use Case: Activity monitoring

GET /api/system/alerts
- Returns: Active system alerts
- Use Case: Alert management

POST /api/system/alerts/:id/resolve
- Returns: Resolution status
- Use Case: Alert resolution
```

### Data Flow Architecture

```
Frontend (Next.js) → API Client → Backend (Express.js) → Database (PostgreSQL)
     ↓                    ↓              ↓                    ↓
React Components → HTTP Requests → Route Handlers → SQL Queries
     ↓                    ↓              ↓                    ↓
UI Updates ← JSON Response ← Data Processing ← Query Results
```

---

## 🗄️ Database Schema & Tables

### Primary Database: `AWS CLOUD DB (PUBLIC IP)`

#### Core Tables

**1. users**
```sql
- id (UUID, Primary Key)
- auth0_sub (VARCHAR, Unique)
- email (VARCHAR, Unique)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- tier (VARCHAR) -- 'free', 'pro', 'enterprise'
- last_login_at (TIMESTAMP)
- country (VARCHAR)
- active (BOOLEAN)
```

**2. resumes**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- filename (VARCHAR)
- file_path (VARCHAR)
- uploaded_at (TIMESTAMP)
- processing_status (VARCHAR) -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
- extracted_data (JSONB)
- ai_analysis (JSONB)
- skills (TEXT[])
- experience_years (INTEGER)
```

**3. job_listings**
```sql
- id (INTEGER, Primary Key)
- title (VARCHAR)
- organization (VARCHAR)
- location_type (VARCHAR)
- employment_type (VARCHAR[])
- remote_derived (BOOLEAN)
- date_posted (DATE)
- date_created (TIMESTAMP)
- description_text (TEXT)
- ai_salary_minvalue (INTEGER)
- ai_salary_maxvalue (INTEGER)
- ai_salary_currency (VARCHAR)
- ai_key_skills (TEXT[])
- url (VARCHAR)
```

**4. payments**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- amount (DECIMAL)
- currency (VARCHAR)
- status (VARCHAR) -- 'pending', 'completed', 'failed', 'refunded'
- created_at (TIMESTAMP)
- payment_method (VARCHAR)
- transaction_id (VARCHAR)
```

**5. user_activity_logs**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- activity_type (VARCHAR)
- details (JSONB)
- created_at (TIMESTAMP)
```

**6. api_logs**
```sql
- id (UUID, Primary Key)
- endpoint (VARCHAR)
- method (VARCHAR)
- url (VARCHAR)
- response_time (INTEGER)
- status_code (INTEGER)
- created_at (TIMESTAMP)
```

### Data Relationships
- **Users** → **Resumes** (One-to-Many)
- **Users** → **Payments** (One-to-Many)
- **Users** → **Activity Logs** (One-to-Many)
- **Resumes** → **Job Matches** (Many-to-Many)

---

## 🔐 Authentication & Security

### Authentication Flow
1. **User Login**: Auth0 integration for secure authentication
2. **JWT Token**: Generate and store JWT tokens in localStorage
3. **Token Validation**: Backend validates tokens on each request
4. **Role-Based Access**: Permissions checked based on user roles
5. **Session Management**: Automatic token refresh and logout

### Security Features
- **HTTPS**: All communications encrypted
- **CORS**: Cross-origin resource sharing configured
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries used
- **Rate Limiting**: API rate limiting implemented
- **Error Handling**: Secure error messages without sensitive data

### Development Mode
- **Authentication Bypass**: Optional bypass for development
- **Mock Tokens**: Development tokens for testing
- **Debug Mode**: Enhanced logging and error details

---

## 🚀 Deployment & Environment

### Frontend Deployment

- **Environment Variables**:
  ```
  NEXT_PUBLIC_API_URL=https://your-backend-url.com
  NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain
  NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
  ```

### Backend Deployment
- 
- **Database**: AWS CLOUD DB(public ip)
- **Environment Variables**:
  ```
  NODE_ENV=production
  DATABASE_URL=postgresql://user:pass@host:port/db (if it is used)
  DB_HOST=your-db-host
  DB_PORT=5432
  DB_NAME=resume_db
  DB_USER=your-db-user
  DB_PASSWORD=your-db-password
  JWT_SECRET=your-jwt-secret
  ```

### Local Development
- **Frontend**: `npm run dev` (localhost:3000)
- **Backend**: `node src/server.js` (localhost:5000)
- **Database**: PostgreSQL (localhost:5433)

---

## 🔧 Troubleshooting & Common Issues

### Common Issues & Solutions

#### 1. **Infinite API Request Loop**
**Problem**: Jobs page making infinite requests
**Solution**: Fixed dependency arrays in React hooks
**Prevention**: Always use primitive values in useEffect dependencies

#### 2. **Database Connection Issues**
**Problem**: Cannot connect to PostgreSQL
**Solution**: Check environment variables and database credentials
**Prevention**: Use connection pooling and proper error handling

#### 3. **Authentication Errors**
**Problem**: 401 Unauthorized errors
**Solution**: Check JWT token validity and permissions
**Prevention**: Implement proper token refresh mechanism

#### 4. **Missing Tables**
**Problem**: "relation does not exist" errors
**Solution**: Run database migration scripts
**Prevention**: Implement proper database initialization

#### 5. **CORS Issues**
**Problem**: Cross-origin requests blocked
**Solution**: Configure CORS headers in backend
**Prevention**: Use proper CORS configuration

### Debugging Tools
- **Browser DevTools**: Network tab for API debugging
- **Console Logs**: Detailed logging in both frontend and backend
- **Database Logs**: PostgreSQL query logs
- **API Testing**: Use tools like Postman for API testing

---

## 🚀 Future Enhancements

### Planned Features
1. **Advanced Analytics**: More detailed reporting and insights
2. **Machine Learning**: Enhanced AI models for better matching
3. **Real-time Notifications**: WebSocket-based real-time updates
4. **Mobile App**: Mobile application for administrators
5. **API Versioning**: Proper API versioning strategy
6. **Caching**: Redis-based caching for improved performance
7. **Monitoring**: Advanced monitoring and alerting system
8. **Backup System**: Automated database backup and recovery

### Technical Improvements
1. **Performance Optimization**: Code splitting and lazy loading
2. **Security Enhancements**: Additional security measures
3. **Testing**: Comprehensive test coverage
4. **Documentation**: API documentation with Swagger
5. **CI/CD**: Automated deployment pipeline
6. **Scalability**: Horizontal scaling capabilities

---

## 📞 Support & Contact

### Getting Help
- **Documentation**: This file serves as the primary documentation
- **Code Comments**: Inline code comments for technical details
- **API Documentation**: Endpoint documentation in code
- **Error Logs**: Check console and server logs for debugging

### Team Roles
- **Frontend Developer**: React/Next.js development
- **Backend Developer**: Node.js/Express.js development
- **Database Administrator**: PostgreSQL management
- **DevOps Engineer**: Deployment and infrastructure
- **QA Engineer**: Testing and quality assurance

---

## 📝 Conclusion

The Upstar Admin Panel is a comprehensive, feature-rich administration system that provides complete control over a resume processing and job matching platform. With its modern technology stack, robust architecture, and extensive feature set, it serves as an essential tool for platform administrators.

This documentation provides a complete overview of the system, from high-level architecture to detailed implementation specifics. New team members can use this guide to quickly understand the system and contribute effectively to its development and maintenance.

**Key Takeaways:**
- ✅ **Fully Functional**: All major features working with real data
- ✅ **Scalable Architecture**: Modern, maintainable codebase
- ✅ **Comprehensive Features**: Complete admin functionality
- ✅ **Real-time Data**: Live metrics and updates
- ✅ **User-Friendly**: Intuitive interface with proper UX
- ✅ **Secure**: Robust authentication and security measures

The system is ready for production use and can be extended with additional features as needed.

---





