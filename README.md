# 🚀 Upstar Admin Panel

A comprehensive admin panel for managing resumes, jobs, and analytics built with Node.js and Next.js.

## 📁 Project Structure

```
upstarflows-admin/
├── upstar-backend/          # Node.js API server
│   ├── src/                # Source code
│   ├── database/           # Database migrations and seeds
│   ├── logs/               # Application logs
│   ├── env.local           # Environment configuration
│   ├── .gitignore          # Git ignore rules
│   └── README.md           # Backend documentation
├── upstar-website/         # Next.js frontend
│   ├── src/                # Source code
│   ├── app/                # Next.js app directory
│   ├── public/             # Static assets
│   ├── .env.local          # Environment configuration
│   ├── .gitignore          # Git ignore rules
│   └── README.md           # Frontend documentation
└── DEPLOYMENT_GUIDE.md    # Detailed deployment instructions
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Git

### Manual Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
  
   
   # Backend
   cd upstar-backend
   npm install
   
   # Frontend
   cd ../upstar-website
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy environment templates
   cp upstar-backend/env.local upstar-backend/env.local.backup
   cp upstar-website/env.template upstar-website/.env.local
   
   # Edit configuration files
   nano upstar-backend/env.local
   nano upstar-website/.env.local
   ```

3. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd upstar-backend
   npm start
   
   # Terminal 2 - Frontend
   cd upstar-website
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 🧪 Testing

```bash
# Test database connection
cd upstar-backend
npm run test:db:remote

# Test API endpoints
npm run test:routes:all

# Test frontend-backend connection
cd ../upstar-website
npm run test:backend
```

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- [Backend API Documentation](upstar-backend/docs/API.md)
- [Database Documentation](upstar-backend/DATABASE_DOCUMENTATION.md)
- [Environment Setup](upstar-backend/ENVIRONMENT_SETUP.md)

## 🔧 Configuration

### Database Configuration
The application uses PostgreSQL with the `resume_db`  database. Configure your database settings in:
- `upstar-backend/env.local` - Backend database connection
- `upstar-website/.env.local` - Frontend API configuration

### Environment Variables
Key environment variables:
- `DB_HOST` - Database host (default: 54.254.3.87 aws cloud ec2 public ip )
- `DB_PORT` - Database port (default: 5433)
- `DB_NAME` - Database name (must be: resume_db)
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Frontend URL for CORS

## 🚀 Features

- **User Management** - User registration, authentication, and role management
- **Resume Processing** - Upload, parse, and analyze resumes
- **Job Management** - Create and manage job postings
- **Analytics Dashboard** - Comprehensive analytics and reporting
- **File Upload** - Support for PDF, DOC, DOCX, TXT files
- **AI Integration** - OpenAI integration for resume analysis
- **Real-time Updates** - Live data updates and notifications

## 🛠️ Development

### Backend Development
```bash
cd upstar-backend
npm run dev          # Start with nodemon
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Frontend Development
```bash
cd upstar-website
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## 🔒 Security

- JWT-based authentication
- CORS protection
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📊 Monitoring

- Health check endpoints
- Performance logging
- Error tracking
- Database monitoring
- Application metrics

## 👥 Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | pallavigisetti12003@gmail.com | admin123 | Full access |
| **Editor** | lagisettipallavi607@gmail.com | editor123 | Content management |
| **Viewer** | pallusweety67@gmail.com | viewer123 | Read-only |

## 🗄️ Database IP Configuration

The following files contain the database IP address `54.254.3.87`(aws cloud db ec2 public ip) and port `5433`:

### Backend Configuration Files
- `upstar-backend/src/config/database.js` - Main database connection pool
- `upstar-backend/env.local` - Environment variables
- `upstar-backend/docker-compose.yml` - Docker environment variables
- `upstar-backend/docker-compose.production.yml` - Production Docker environment

### Database Scripts
- `upstar-backend/database/init-db.js` - Database initialization script
- `upstar-backend/check-db.js` - Database connection checker
- `upstar-backend/setup-complete-database.js` - Complete database setup
- `upstar-backend/setup-resume-database.js` - Resume database setup
- `upstar-backend/create-missing-tables.js` - Missing tables creator
- `upstar-backend/fix-analytics.js` - Analytics fix script
- `upstar-backend/fix-users-table.js` - Users table fix script
- `upstar-backend/check-table-structures.js` - Table structure checker
- `upstar-backend/create-user-activity-logs.js` - Activity logs creator

### Testing Files
- `upstar-backend/test-environment.js` - Environment testing
- `upstar-backend/test-remote-db.js` - Remote database testing
- `upstar-backend/verify-env.js` - Environment verification
- `upstar-website/test-database-config.js` - Frontend database config test

### Documentation Files
- `README.md` - Main documentation (this file)
- `upstar-backend/README.md` - Backend documentation

**Note:** All these files use `54.254.3.87:5433` as the default (ec2 public ip) database connection. To change the database server, update the IP address in these files or set the `DB_HOST` environment variable.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check logs for error messages
2. Verify environment configuration

## 🔄 Updates

To update the application:
```bash
git pull origin main
cd upstar-backend && npm ci
cd ../upstar-website && npm ci
npm run migrate  # If database changes
```

---

**Built with ❤️ by the Upstar Team**
