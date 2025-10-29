# 🚀 Upstar Admin Panel - Production Deployment Guide

This guide covers deploying the Upstar Admin Panel to production environments.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores recommended

### Software Requirements
- **Node.js 18+**
- **PostgreSQL 16+**
- **Nginx** (for reverse proxy)
- **PM2** (for process management)
- **SSL Certificate** (Let's Encrypt recommended)

## 🏗️ Deployment Options

### Option 1: Traditional Server Deployment
Deploy directly on a VPS or dedicated server.

### Option 2: Docker Deployment
Use Docker containers for easier management.

### Option 3: Cloud Platform Deployment
Deploy on AWS, Google Cloud, or Azure.

## 🔧 Traditional Server Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE resume_db;
CREATE USER upstar_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE resume_db TO upstar_user;
\q

# Configure PostgreSQL for remote connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Uncomment and set: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Application Deployment

```bash
# Clone repository
git clone <your-github-repo-url>


# Install dependencies
cd upstar-backend
npm ci --production
cd ../upstar-website
npm ci --production
cd ..

# Build frontend
cd upstar-website
npm run build
cd ..
```

### Step 4: Environment Configuration

#### Backend Environment (`upstar-backend/env.local`)
```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=54.254.3.87
DB_PORT=5433
DB_NAME=resume_db
DB_USER=developer
DB_PASSWORD=localpass

# Security (CHANGE THESE!)
JWT_SECRET=your_super_secure_jwt_secret_for_production
SESSION_SECRET=your_super_secure_session_secret_for_production
ENCRYPTION_KEY=your_super_secure_encryption_key_for_production

# CORS Configuration
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true
FRONTEND_URL=https://your-domain.com

# Production Settings
LOG_LEVEL=warn
ENABLE_METRICS=true
BACKUP_ENABLED=true
```

#### Frontend Environment (`upstar-website/.env.local`)
```env
# Production Environment
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_ENVIRONMENT=production
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=warn
```

### Step 5: Database Migration

```bash
cd upstar-backend
npm run migrate:prod
npm run seed
```

### Step 6: Process Management with PM2

#### Create PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'upstar-backend',
      script: 'src/server.js',
      cwd: './upstar-backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'upstar-frontend',
      script: 'npm',
      args: 'start',
      cwd: './upstar-website',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
```

#### Start Applications
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### Step 7: Nginx Configuration

#### Create Nginx Configuration (`/etc/nginx/sites-available/upstar`)
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/upstar /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🐳 Docker Deployment

### Step 1: Create Docker Compose (`docker-compose.prod.yml`)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: upstar-postgres-prod
    environment:
      POSTGRES_DB: resume_db
      POSTGRES_USER: upstar_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./upstar-backend/database/init-db.js:/docker-entrypoint-initdb.d/init-db.js
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U upstar_user -d resume_db"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./upstar-backend
      dockerfile: Dockerfile.production
    container_name: upstar-backend-prod
    environment:
      - NODE_ENV=production
      - DB_HOST=54.254.3.87
      - DB_PORT=5433
      - DB_NAME=resume_db
      - DB_USER=developer
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - CORS_ORIGIN=https://your-domain.com
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  frontend:
    build:
      context: ./upstar-website
      dockerfile: Dockerfile.production
    container_name: upstar-frontend-prod
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.your-domain.com
      - NEXT_PUBLIC_APP_ENVIRONMENT=production
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: upstar-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 2: Environment File (`.env.prod`)
```env
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_super_secure_jwt_secret
SESSION_SECRET=your_super_secure_session_secret
ENCRYPTION_KEY=your_super_secure_encryption_key
```

### Step 3: Deploy with Docker
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### Using AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init upstar-admin

# Create environment
eb create production

# Deploy
eb deploy
```

#### Using AWS ECS
1. Create ECS cluster
2. Create task definitions for backend and frontend
3. Create services
4. Configure load balancer
5. Set up RDS for database

### Google Cloud Platform

#### Using Cloud Run
```bash
# Build and deploy backend
gcloud run deploy upstar-backend --source ./upstar-backend --platform managed --region us-central1

# Build and deploy frontend
gcloud run deploy upstar-frontend --source ./upstar-website --platform managed --region us-central1
```

## 🔍 Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Log Management
```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View application logs
tail -f logs/combined.log
```

### Backup Strategy
```bash
# Database backup
pg_dump -h localhost -U upstar_user resume_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz upstarflows-admin/

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h localhost -U upstar_user resume_db > $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /path/to/upstarflows-admin/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Performance Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Run performance analysis
clinic doctor -- node src/server.js

# Monitor system resources
htop
iostat -x 1
```

## 🔒 Security Considerations

### Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Security
```sql
-- Create read-only user for monitoring
CREATE USER monitor_user WITH PASSWORD 'monitor_password';
GRANT CONNECT ON DATABASE resume_db TO monitor_user;
GRANT USAGE ON SCHEMA public TO monitor_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitor_user;
```

### Application Security
- Use strong passwords
- Enable HTTPS only
- Regular security updates
- Monitor logs for suspicious activity
- Implement rate limiting
- Use environment variables for secrets

## 🚀 Deployment Checklist

- [ ] Server provisioned and configured
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] PM2 configured and applications started
- [ ] Nginx configuration tested and enabled
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security measures applied
- [ ] Performance testing completed

## 📞 Support

For deployment issues:
1. Check logs for error messages
2. Verify all services are running
3. Test database connectivity
4. Check firewall settings
5. Review environment configuration

See the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues and solutions.





