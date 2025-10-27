#!/bin/bash

# Upstar Backend Deployment Script
set -e

echo "🚀 Starting Upstar Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/backups/upstar"
LOG_FILE="/var/log/upstar-deploy.log"
SERVICE_NAME="upstar-backend"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup current database (if exists)
if docker ps | grep -q "upstar-postgres"; then
    log "Creating database backup..."
    docker exec upstar-postgres pg_dump -U upstar_user upstar_production > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
    log "Database backup created successfully"
fi

# Stop existing services
log "Stopping existing services..."
docker-compose -f docker-compose.production.yml down || true

# Pull latest images
log "Pulling latest Docker images..."
docker-compose -f docker-compose.production.yml pull

# Build application image
log "Building application image..."
docker-compose -f docker-compose.production.yml build --no-cache

# Run database migrations
log "Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm backend npm run migrate:prod

# Start services
log "Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Health check
log "Performing health check..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log "✅ Health check passed"
else
    error "❌ Health check failed"
fi

# Clean up old images
log "Cleaning up old Docker images..."
docker image prune -f

log "🎉 Deployment completed successfully!"
log "📊 Application is running at: http://localhost:5000"
log "🔍 Health check: http://localhost:5000/api/health"
log "📝 Logs: docker-compose -f docker-compose.production.yml logs -f"



