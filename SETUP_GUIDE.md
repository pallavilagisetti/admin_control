# 🚀 Upstar Admin Panel - Complete Setup Guide

This guide will help you set up and run the Upstar Admin Panel on any machine after cloning from GitHub.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL 16+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Optional Software
- **Redis** (for job queues) - [Download here](https://redis.io/download)
- **Docker** (for containerized deployment) - [Download here](https://www.docker.com/)

## 🏗️ Project Structure

```
upstarflows-admin/
├── upstar-backend/     # Node.js API server
├── upstar-website/     # Next.js frontend
└── README.md
```

## ⚡ Quick Setup (Automated)

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd upstarflows-admin
```

### 2. Run the Setup Script
```bash
# Make the setup script executable
chmod +x setup.sh

# Run the automated setup
./setup.sh
```

### 3. Configure Environment
```bash
# Copy and edit environment files
cp upstar-backend/env.local upstar-backend/env.local.backup
cp upstar-website/env.example upstar-website/.env.local

# Edit the environment files with your settings
nano upstar-backend/env.local
nano upstar-website/.env.local
```

### 4. Start the Application
```bash
# Start backend (Terminal 1)
cd upstar-backend
npm start

# Start frontend (Terminal 2)
cd upstar-website
npm run dev
```

## 🔧 Manual Setup (Step by Step)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-github-repo-url>
cd upstarflows-admin

# Install backend dependencies
cd upstar-backend
npm install

# Install frontend dependencies
cd ../upstar-website
npm install
```

### Step 2: Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb resume_db

# Or using psql
psql -U postgres
CREATE DATABASE resume_db;
\q
```

#### Option B: Remote Database
Use the existing remote database at `54.254.3.87:5433`

### Step 3: Environment Configuration

#### Backend Environment (`upstar-backend/env.local`)
```env
# Database Configuration
DB_HOST=54.254.3.87
DB_PORT=5433
DB_NAME=resume_db
DB_USER=postgres
DB_PASSWORD=password

# Server Configuration
NODE_ENV=development
PORT=5000

# Security (CHANGE THESE!)
JWT_SECRET=your_jwt_secret_key_change_this
SESSION_SECRET=your_session_secret_key_change_this
ENCRYPTION_KEY=your_encryption_key_32_chars_long

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (`upstar-website/.env.local`)
```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Application Configuration
NEXT_PUBLIC_APP_NAME=Upstar Admin Panel
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENVIRONMENT=development

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

### Step 4: Database Initialization

```bash
cd upstar-backend

# Test database connection
npm run test:db:remote

# Run database migrations
npm run migrate

# Seed the database (optional)
npm run seed
```

### Step 5: Start the Application

#### Development Mode
```bash
# Terminal 1 - Backend
cd upstar-backend
npm run dev

# Terminal 2 - Frontend
cd upstar-website
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd upstar-website
npm run build

# Start backend
cd ../upstar-backend
npm run start:prod

# Start frontend
cd ../upstar-website
npm run start:prod
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **API Documentation**: http://localhost:5000/api-docs

## 🐳 Docker Setup (Alternative)

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Containers
```bash
# Backend
cd upstar-backend
docker build -t upstar-backend .
docker run -p 5000:5000 --env-file env.local upstar-backend

# Frontend
cd upstar-website
docker build -t upstar-frontend .
docker run -p 3000:3000 --env-file .env.local upstar-frontend
```

## 🧪 Testing

### Test Database Connection
```bash
cd upstar-backend
npm run test:db:remote
```

### Test API Endpoints
```bash
cd upstar-backend
npm run test:routes:all
```

### Test Frontend-Backend Connection
```bash
cd upstar-website
npm run test:backend
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready -h 54.254.3.87 -p 5433

# Test connection manually
psql -h 54.254.3.87 -p 5433 -U postgres -d resume_db
```

#### 2. Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### 3. Environment Variables Not Loading
```bash
# Verify environment file exists
ls -la upstar-backend/env.local

# Test environment loading
cd upstar-backend
node verify-env.js
```

#### 4. Frontend Build Errors
```bash
# Clear Next.js cache
cd upstar-website
rm -rf .next
npm run build
```

### Log Files
- **Backend logs**: `upstar-backend/logs/`
- **Frontend logs**: Check terminal output
- **Database logs**: Check PostgreSQL logs

## 📚 Additional Resources

- [Backend API Documentation](upstar-backend/docs/API.md)
- [Database Documentation](upstar-backend/DATABASE_DOCUMENTATION.md)
- [Environment Setup Guide](upstar-backend/ENVIRONMENT_SETUP.md)
- [Testing Guide](upstar-backend/TESTING.md)

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** for error messages
2. **Run the test scripts** to identify issues
3. **Verify environment variables** are set correctly
4. **Check database connectivity**
5. **Review the troubleshooting section** above

## 🎯 Production Deployment

For production deployment:

1. **Update environment variables** for production
2. **Use production database** credentials
3. **Enable SSL/HTTPS**
4. **Set up proper logging**
5. **Configure monitoring**
6. **Set up backups**

See the [Production Deployment Guide](GITHUB_DEPLOYMENT_GUIDE.md) for detailed instructions.

