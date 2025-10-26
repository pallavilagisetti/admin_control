#!/bin/bash

# Upstar Backend Monitoring Script
set -e

echo "📊 Upstar Backend Monitoring..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="/var/log/upstar-monitor.log"
ALERT_EMAIL="admin@your-domain.com"
DISK_THRESHOLD=80
MEMORY_THRESHOLD=80
CPU_THRESHOLD=80

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check if containers are running
    if ! docker ps | grep -q "upstar-backend-prod"; then
        error "Backend container is not running"
        return 1
    fi
    
    if ! docker ps | grep -q "upstar-postgres-prod"; then
        error "PostgreSQL container is not running"
        return 1
    fi
    
    # Check API health
    if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        error "API health check failed"
        return 1
    fi
    
    log "✅ All services are healthy"
    return 0
}

# Check system resources
check_resources() {
    log "Checking system resources..."
    
    # Check disk usage
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
        warning "Disk usage is high: ${DISK_USAGE}%"
    else
        info "Disk usage: ${DISK_USAGE}%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
        warning "Memory usage is high: ${MEMORY_USAGE}%"
    else
        info "Memory usage: ${MEMORY_USAGE}%"
    fi
    
    # Check CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
        warning "CPU usage is high: ${CPU_USAGE}%"
    else
        info "CPU usage: ${CPU_USAGE}%"
    fi
}

# Check database status
check_database() {
    log "Checking database status..."
    
    # Check PostgreSQL status
    if docker exec upstar-postgres-prod pg_isready -U upstar_user -d upstar_production > /dev/null 2>&1; then
        info "✅ PostgreSQL is ready"
    else
        error "❌ PostgreSQL is not ready"
        return 1
    fi
    
    # Check database size
    DB_SIZE=$(docker exec upstar-postgres-prod psql -U upstar_user -d upstar_production -t -c "SELECT pg_size_pretty(pg_database_size('upstar_production'));" | xargs)
    info "Database size: $DB_SIZE"
}

# Check application logs
check_logs() {
    log "Checking application logs for errors..."
    
    # Check for errors in the last 5 minutes
    ERROR_COUNT=$(docker-compose -f docker-compose.production.yml logs --since=5m backend 2>&1 | grep -i error | wc -l)
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        warning "Found $ERROR_COUNT errors in the last 5 minutes"
        docker-compose -f docker-compose.production.yml logs --since=5m backend | grep -i error | tail -5
    else
        info "✅ No errors found in recent logs"
    fi
}

# Generate report
generate_report() {
    log "Generating monitoring report..."
    
    echo "=== Upstar Backend Monitoring Report ===" | tee -a $LOG_FILE
    echo "Date: $(date)" | tee -a $LOG_FILE
    echo "Hostname: $(hostname)" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    
    echo "=== Service Status ===" | tee -a $LOG_FILE
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    
    echo "=== System Resources ===" | tee -a $LOG_FILE
    echo "Disk Usage: $(df / | awk 'NR==2 {print $5}')" | tee -a $LOG_FILE
    echo "Memory Usage: $(free | awk 'NR==2{printf "%.0f%%", $3*100/$2}')" | tee -a $LOG_FILE
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    
    echo "=== Database Status ===" | tee -a $LOG_FILE
    docker exec upstar-postgres-prod psql -U upstar_user -d upstar_production -c "SELECT version();" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    
    echo "=== Recent Errors ===" | tee -a $LOG_FILE
    docker-compose -f docker-compose.production.yml logs --since=1h backend | grep -i error | tail -10 | tee -a $LOG_FILE
}

# Main monitoring function
main() {
    log "Starting monitoring check..."
    
    # Run all checks
    check_health
    check_resources
    check_database
    check_logs
    
    # Generate report
    generate_report
    
    log "✅ Monitoring check completed"
}

# Run monitoring
main "$@"


