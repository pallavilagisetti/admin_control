# SkillGraph AI - Admin Platform

A comprehensive admin platform for SkillGraph AI, featuring a modern React frontend and robust Node.js backend with real-time analytics, user management, and report generation capabilities.

## 🏗️ Project Structure

```
upstarflows/
├── upstar-backend/          # Node.js API Backend
│   ├── src/                 # Source code
│   ├── database/            # Database schemas and migrations
│   ├── uploads/             # File uploads directory
│   ├── .env                 # Environment variables
│   ├── .gitignore           # Git ignore rules
│   └── README.md            # Backend documentation
├── upstar-website/          # Next.js Frontend
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── .env                 # Environment variables
│   ├── .gitignore           # Git ignore rules
│   └── README.md            # Frontend documentation
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 12+
- **Redis** 6+
- **npm** or **yarn**

### 1. Clone Repository

```bash
git clone <repository-url>
cd upstarflows
```

### 2. Backend Setup

```bash
cd upstar-backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd upstar-website
npm install
cp .env.example .env.local  # Configure your environment variables
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Authentication

### Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | pallavigisetti12003@gmail.com | admin123 | Full access |
| **Editor** | lagisettipallavi607@gmail.com | editor123 | Content management |
| **Viewer** | pallusweety67@gmail.com | viewer123 | Read-only |

## ✨ Key Features

### 🎯 Admin Dashboard
- **Real-time Analytics**: Live data from your database
- **User Management**: Complete user lifecycle management
- **Role-based Access**: Admin, Editor, Viewer permissions
- **Responsive Design**: Works on all devices

### 📊 Analytics & Reporting
- **Comprehensive Reports**: Export detailed analytics
- **Real Data Integration**: No more mock data
- **Performance Metrics**: System health monitoring
- **Growth Tracking**: User and revenue analytics

### 🔒 Security
- **JWT Authentication**: Secure token-based auth
- **Role-based Permissions**: Granular access control
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Secure cross-origin requests

### 🚀 Performance
- **Queue System**: Background job processing
- **Database Optimization**: Efficient queries and indexing
- **Caching**: Redis-based caching strategy
- **Error Handling**: Robust error management

## 🛠️ Technology Stack

### Frontend (upstar-website)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Context** - State management
- **Custom API Client** - HTTP client with error handling

### Backend (upstar-backend)
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queue
- **JWT** - Authentication tokens
- **Bull** - Job queue management

## 📋 Environment Setup

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/skillgraph_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🗄️ Database Schema

### Core Entities
- **Users**: User accounts and profiles
- **Resumes**: Document processing and analysis
- **Jobs**: Job postings and applications
- **Payments**: Transaction tracking
- **Activity Logs**: User behavior tracking
- **API Logs**: Performance monitoring

## 🔄 Development Workflow

### 1. Start Both Services
```bash
# Terminal 1 - Backend
cd upstar-backend
npm run dev

# Terminal 2 - Frontend
cd upstar-website
npm run dev
```

### 2. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 3. Login & Test
1. Go to http://localhost:3000/login
2. Use test credentials from the table above
3. Explore the dashboard features
4. Generate analytics reports

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current user info
- `POST /api/auth/logout` - Session termination

### Analytics
- `GET /api/dashboard/analytics-report` - Generate reports
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/health` - System health

### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting
- Check PostgreSQL is running
- Verify Redis is accessible
- Check environment variables

#### Frontend Connection Errors
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API URL in environment

#### Authentication Issues
- Use provided test accounts
- Check JWT secret configuration
- Verify token storage in browser

### Debug Commands

```bash
# Check backend health
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pallavigisetti12003@gmail.com","password":"admin123"}'

# Check frontend build
cd upstar-website && npm run build
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set secure JWT secrets
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates
- [ ] Configure Redis for production
- [ ] Set up monitoring and logging

### Docker Deployment
```bash
# Backend
cd upstar-backend
docker build -t skillgraph-backend .
docker run -p 5000:5000 skillgraph-backend

# Frontend
cd upstar-website
docker build -t skillgraph-frontend .
docker run -p 3000:3000 skillgraph-frontend
```

## 📈 Performance Monitoring

### Key Metrics
- **API Response Time**: < 200ms average
- **Database Query Performance**: Optimized queries
- **Memory Usage**: Efficient resource utilization
- **Error Rates**: < 1% error rate target

### Monitoring Tools
- Built-in API logging
- Database query analysis
- Redis performance metrics
- Frontend performance tracking

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive error handling
- Add proper logging for debugging
- Test with provided test accounts
- Update documentation for new features

## 📄 License

This project is part of the SkillGraph AI platform. All rights reserved.

## 🆘 Support

### Getting Help
1. **Check Documentation**: Review README files in both projects
2. **Test Accounts**: Use provided test credentials
3. **Console Logs**: Check browser console and server logs
4. **Health Checks**: Verify all services are running

### Contact
For technical support and questions about the SkillGraph AI admin platform.

---

**🎯 Ready to manage your SkillGraph AI platform with real-time analytics and comprehensive admin capabilities!**
