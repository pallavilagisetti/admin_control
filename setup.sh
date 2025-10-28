#!/bin/bash

# 🚀 Upstar Admin Panel - Automated Setup Script
# This script sets up the entire application on a new machine

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_error "Node.js version 18+ required. Current version: $(node --version)"
            exit 1
        fi
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists git; then
        missing_deps+=("Git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd upstar-backend
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd upstar-website
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    cd ..
    
    print_success "Dependencies installed successfully!"
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f upstar-backend/env.local ]; then
        print_warning "Backend environment file not found. Creating from template..."
        cat > upstar-backend/env.local << 'EOF'
# Unified Environment Configuration
NODE_ENV=development
PORT=5000

# Database Configuration (resume_db only)
DB_HOST=54.254.3.87
DB_PORT=5433
DB_NAME=resume_db
DB_USER=postgres
DB_PASSWORD=password

# Database Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_SSL=false

# Authentication & Security
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security Settings
BCRYPT_ROUNDS=10
SESSION_SECRET=your_session_secret_key_change_this_in_production
ENCRYPTION_KEY=your_encryption_key_32_chars_long_change_this

# CORS & Frontend Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Health Check & Monitoring
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
METRICS_COLLECTION_INTERVAL=60000
ENABLE_METRICS=false
METRICS_PORT=9090
EOF
        print_success "Backend environment file created!"
    else
        print_success "Backend environment file already exists!"
    fi
    
    # Frontend environment
    if [ ! -f upstar-website/.env.local ]; then
        print_warning "Frontend environment file not found. Creating from template..."
        cat > upstar-website/.env.local << 'EOF'
# Frontend Environment Variables

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

# Development Configuration
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png

# Pagination Configuration
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20
NEXT_PUBLIC_MAX_PAGE_SIZE=100

# Cache Configuration
NEXT_PUBLIC_CACHE_TTL=300000
NEXT_PUBLIC_ENABLE_CACHE=true
EOF
        print_success "Frontend environment file created!"
    else
        print_success "Frontend environment file already exists!"
    fi
}

# Function to test database connection
test_database() {
    print_status "Testing database connection..."
    
    cd upstar-backend
    
    if npm run test:db:remote > /dev/null 2>&1; then
        print_success "Database connection successful!"
    else
        print_warning "Database connection failed. Please check your database settings in env.local"
        print_status "You can test the connection later with: npm run test:db:remote"
    fi
    
    cd ..
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create uploads directory
    mkdir -p upstar-backend/uploads
    mkdir -p upstar-backend/logs
    
    # Create logs directory
    mkdir -p upstar-website/logs
    
    print_success "Directories created!"
}

# Function to run initial database setup
setup_database() {
    print_status "Setting up database..."
    
    cd upstar-backend
    
    # Test connection first
    if npm run test:db:remote > /dev/null 2>&1; then
        print_status "Running database migrations..."
        if npm run migrate > /dev/null 2>&1; then
            print_success "Database migrations completed!"
        else
            print_warning "Database migrations failed. You may need to run them manually later."
        fi
        
        print_status "Seeding database..."
        if npm run seed > /dev/null 2>&1; then
            print_success "Database seeded successfully!"
        else
            print_warning "Database seeding failed. You may need to run it manually later."
        fi
    else
        print_warning "Database connection failed. Skipping database setup."
        print_status "Please fix database connection and run: npm run migrate && npm run seed"
    fi
    
    cd ..
}

# Function to display final instructions
show_final_instructions() {
    print_success "Setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Review and update environment files:"
    echo "   - upstar-backend/env.local"
    echo "   - upstar-website/.env.local"
    echo ""
    echo "2. Start the application:"
    echo "   # Terminal 1 - Backend"
    echo "   cd upstar-backend"
    echo "   npm start"
    echo ""
    echo "   # Terminal 2 - Frontend"
    echo "   cd upstar-website"
    echo "   npm run dev"
    echo ""
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000"
    echo "   - Health Check: http://localhost:5000/api/health"
    echo ""
    echo "4. Test the setup:"
    echo "   cd upstar-backend && npm run test:db:remote"
    echo "   cd upstar-website && npm run test:backend"
    echo ""
    print_status "For more information, see SETUP_GUIDE.md"
}

# Main execution
main() {
    echo "🚀 Upstar Admin Panel - Automated Setup"
    echo "========================================"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -d "upstar-backend" ] || [ ! -d "upstar-website" ]; then
        print_error "Please run this script from the root directory of the project"
        print_status "Expected structure:"
        print_status "  upstarflows-admin/"
        print_status "  ├── upstar-backend/"
        print_status "  ├── upstar-website/"
        print_status "  └── setup.sh"
        exit 1
    fi
    
    check_prerequisites
    install_dependencies
    setup_environment
    create_directories
    test_database
    setup_database
    show_final_instructions
}

# Run main function
main "$@"

