#!/bin/bash

# Upstar Backend Rollback Script
set -e

echo "🔄 Starting Upstar Backend Rollback..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/backups/upstar"
LOG_FILE="/var/log/upstar-rollback.log"

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

# Check if backup exists
LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql 2>/dev/null | head -n1)
if [ -z "$LATEST_BACKUP" ]; then
    error "No backup found in $BACKUP_DIR"
fi

log "Found latest backup: $LATEST_BACKUP"

# Stop current services
log "Stopping current services..."
docker-compose -f docker-compose.production.yml down

# Restore database from backup
log "Restoring database from backup..."
docker-compose -f docker-compose.production.yml up -d postgres
sleep 10

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
until docker exec upstar-postgres-prod pg_isready -U upstar_user -d upstar_production; do
    log "Waiting for PostgreSQL..."
    sleep 2
done

# Restore database
docker exec -i upstar-postgres-prod psql -U upstar_user -d upstar_production < $LATEST_BACKUP

# Start all services
log "Starting all services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Health check
log "Performing health check..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log "✅ Rollback completed successfully"
    log "📊 Application is running at: http://localhost:5000"
else
    error "❌ Rollback failed - health check failed"
fi


