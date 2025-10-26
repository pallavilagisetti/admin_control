# Backend API Routes for Admin Panel

## 📊 Dashboard & Analytics
```
GET    /api/dashboard/stats
GET    /api/dashboard/overview
GET    /api/analytics/users
GET    /api/analytics/activity
GET    /api/analytics/revenue
```

## 👥 User Management
```
GET    /api/users                    # Get all users with pagination/filters
GET    /api/users/:id                # Get specific user details
POST   /api/users                    # Create new user
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Delete user
PUT    /api/users/:id/status         # Activate/deactivate user
POST   /api/users/:id/login-as       # Login as user (admin feature)
GET    /api/users/:id/analytics      # Get user analytics
POST   /api/users/bulk               # Bulk user operations
```

## 📄 Resume Management
```
GET    /api/resumes                  # Get all resumes
GET    /api/resumes/:id              # Get specific resume
POST   /api/resumes                  # Upload new resume
PUT    /api/resumes/:id              # Update resume
DELETE /api/resumes/:id              # Delete resume
GET    /api/resumes/:id/analysis     # Get resume analysis
POST   /api/resumes/analyze          # Analyze resume
GET    /api/resumes/stats            # Resume statistics
```

## 🎯 Skills Management
```
GET    /api/skills                   # Get all skills
GET    /api/skills/popular           # Get popular skills
GET    /api/skills/gaps              # Get skill gaps
GET    /api/skills/distribution      # Get skill distribution
POST   /api/skills                   # Add new skill
PUT    /api/skills/:id               # Update skill
DELETE /api/skills/:id               # Delete skill
GET    /api/skills/analytics         # Skills analytics
```

## 💼 Job Management
```
GET    /api/jobs                     # Get all jobs
GET    /api/jobs/:id                 # Get specific job
POST   /api/jobs                     # Create new job
PUT    /api/jobs/:id                 # Update job
DELETE /api/jobs/:id                 # Delete job
GET    /api/jobs/active              # Get active jobs
GET    /api/jobs/analytics           # Job analytics
POST   /api/jobs/:id/match           # Match jobs with users
```

## 🤖 AI Settings
```
GET    /api/ai/settings              # Get AI configuration
PUT    /api/ai/settings              # Update AI settings
GET    /api/ai/models                # Get available AI models
POST   /api/ai/train                 # Train AI model
GET    /api/ai/performance           # AI performance metrics
POST   /api/ai/test                  # Test AI functionality
```

## 💰 Payment Management
```
GET    /api/payments                 # Get all payments
GET    /api/payments/:id             # Get specific payment
POST   /api/payments                 # Process payment
PUT    /api/payments/:id             # Update payment
GET    /api/payments/analytics       # Payment analytics
GET    /api/payments/refunds         # Get refunds
POST   /api/payments/:id/refund      # Process refund
GET    /api/subscriptions            # Get subscriptions
PUT    /api/subscriptions/:id        # Update subscription
```

## 📝 Content Management System (CMS)
```
GET    /api/cms/articles             # Get all articles
GET    /api/cms/articles/:id         # Get specific article
POST   /api/cms/articles             # Create article
PUT    /api/cms/articles/:id         # Update article
DELETE /api/cms/articles/:id         # Delete article
GET    /api/cms/categories           # Get categories
POST   /api/cms/categories           # Create category
PUT    /api/cms/categories/:id       # Update category
```

## 🔔 Notifications
```
GET    /api/notifications            # Get all notifications
GET    /api/notifications/:id        # Get specific notification
POST   /api/notifications            # Send notification
PUT    /api/notifications/:id        # Update notification
DELETE /api/notifications/:id        # Delete notification
POST   /api/notifications/bulk       # Send bulk notifications
GET    /api/notifications/templates  # Get notification templates
```

## 🏥 System Health
```
GET    /api/system/health            # System health status
GET    /api/system/metrics           # System metrics
GET    /api/system/logs              # System logs
GET    /api/system/performance       # Performance metrics
POST   /api/system/backup            # Create system backup
GET    /api/system/status            # System status
```

## 🔐 Authentication & Authorization
```
POST   /api/auth/login               # User login
POST   /api/auth/logout              # User logout
POST   /api/auth/refresh             # Refresh token
GET    /api/auth/me                  # Get current user
PUT    /api/auth/profile             # Update profile
POST   /api/auth/change-password     # Change password
```

## 📈 Analytics & Reporting
```
GET    /api/reports/users            # User reports
GET    /api/reports/revenue          # Revenue reports
GET    /api/reports/activity         # Activity reports
GET    /api/reports/export           # Export reports
POST   /api/reports/generate         # Generate custom report
```

## 🔧 Utility Routes
```
GET    /api/health                   # API health check
GET    /api/version                  # API version info
POST   /api/upload                   # File upload
GET    /api/search                   # Global search
GET    /api/export/:type             # Export data
POST   /api/import/:type             # Import data
```

---

## 📋 Key Requirements for Backend Developer

### 🔒 Security
- JWT authentication for all protected routes
- Role-based access control (if needed later)
- Input validation and sanitization
- Rate limiting
- CORS configuration

### 📊 Data Structure
- Pagination for list endpoints
- Filtering and sorting capabilities
- Search functionality
- Bulk operations support

### 📈 Analytics Data
- User activity tracking
- Performance metrics
- Revenue analytics
- System health monitoring

### 🔄 Real-time Features
- WebSocket support for live updates
- Real-time notifications
- Live system monitoring

### 📁 File Handling
- Resume file uploads
- Image uploads for CMS
- File validation and storage
- CDN integration for assets

---

## 📝 Example Request/Response Formats

### User List Response
```json
{
  "users": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "active": true,
      "userType": "external",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "loginCount": 45,
      "subscription": {
        "plan": "premium",
        "status": "active",
        "expiresAt": "2024-12-31"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Dashboard Stats Response
```json
{
  "totalUsers": 1250,
  "activeUsers": 980,
  "totalRevenue": 45000,
  "monthlyRevenue": 8500,
  "systemHealth": "healthy",
  "recentActivity": [
    {
      "type": "user_signup",
      "message": "New user registered",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

---

## 🚀 Implementation Priority

### Phase 1 (Core Features)
1. Authentication routes
2. User management routes
3. Dashboard stats
4. Basic CRUD operations

### Phase 2 (Advanced Features)
1. Analytics and reporting
2. File upload handling
3. Real-time notifications
4. System monitoring

### Phase 3 (Optimization)
1. Performance optimization
2. Advanced search
3. Bulk operations
4. Export/Import functionality
