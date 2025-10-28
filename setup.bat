@echo off
REM 🚀 Upstar Admin Panel - Windows Setup Script
REM This script sets up the entire application on a Windows machine

echo 🚀 Upstar Admin Panel - Automated Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i
if %NODE_MAJOR% lss 18 (
    echo [ERROR] Node.js version 18+ required. Current version: %NODE_VERSION%
    pause
    exit /b 1
)

echo [SUCCESS] Node.js version %NODE_VERSION% detected!

REM Check if we're in the right directory
if not exist "upstar-backend" (
    echo [ERROR] Please run this script from the root directory of the project
    echo Expected structure:
    echo   upstarflows-admin/
    echo   ├── upstar-backend/
    echo   ├── upstar-website/
    echo   └── setup.bat
    pause
    exit /b 1
)

if not exist "upstar-website" (
    echo [ERROR] Please run this script from the root directory of the project
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies...
cd upstar-backend
if exist package-lock.json (
    npm ci
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo [INFO] Installing frontend dependencies...
cd upstar-website
if exist package-lock.json (
    npm ci
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo [INFO] Setting up environment files...

REM Create backend environment file if it doesn't exist
if not exist "upstar-backend\env.local" (
    echo [WARNING] Backend environment file not found. Creating from template...
    (
        echo # Unified Environment Configuration
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Database Configuration ^(resume_db only^)
        echo DB_HOST=54.254.3.87
        echo DB_PORT=5433
        echo DB_NAME=resume_db
        echo DB_USER=postgres
        echo DB_PASSWORD=password
        echo.
        echo # Database Connection Pool Settings
        echo DB_MAX_CONNECTIONS=20
        echo DB_IDLE_TIMEOUT=30000
        echo DB_CONNECTION_TIMEOUT=2000
        echo DB_SSL=false
        echo.
        echo # Authentication ^& Security
        echo JWT_SECRET=your_jwt_secret_key_change_this_in_production
        echo JWT_EXPIRES_IN=1h
        echo JWT_REFRESH_EXPIRES_IN=7d
        echo.
        echo # Security Settings
        echo BCRYPT_ROUNDS=10
        echo SESSION_SECRET=your_session_secret_key_change_this_in_production
        echo ENCRYPTION_KEY=your_encryption_key_32_chars_long_change_this
        echo.
        echo # CORS ^& Frontend Configuration
        echo CORS_ORIGIN=http://localhost:3000
        echo CORS_CREDENTIALS=true
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # File Upload Configuration
        echo MAX_FILE_SIZE=10485760
        echo UPLOAD_PATH=./uploads
        echo ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png
        echo.
        echo # Logging Configuration
        echo LOG_LEVEL=info
        echo LOG_FILE_PATH=./logs
        echo.
        echo # Health Check ^& Monitoring
        echo HEALTH_CHECK_INTERVAL=30000
        echo HEALTH_CHECK_TIMEOUT=5000
        echo METRICS_COLLECTION_INTERVAL=60000
        echo ENABLE_METRICS=false
        echo METRICS_PORT=9090
    ) > upstar-backend\env.local
    echo [SUCCESS] Backend environment file created!
) else (
    echo [SUCCESS] Backend environment file already exists!
)

REM Create frontend environment file if it doesn't exist
if not exist "upstar-website\.env.local" (
    echo [WARNING] Frontend environment file not found. Creating from template...
    (
        echo # Frontend Environment Variables
        echo.
        echo # Backend API Configuration
        echo NEXT_PUBLIC_API_URL=http://localhost:5000
        echo NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
        echo.
        echo # Application Configuration
        echo NEXT_PUBLIC_APP_NAME=Upstar Admin Panel
        echo NEXT_PUBLIC_APP_VERSION=1.0.0
        echo NEXT_PUBLIC_APP_ENVIRONMENT=development
        echo.
        echo # Feature Flags
        echo NEXT_PUBLIC_ENABLE_ANALYTICS=true
        echo NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
        echo NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
        echo NEXT_PUBLIC_ENABLE_AI_FEATURES=true
        echo.
        echo # Development Configuration
        echo NEXT_PUBLIC_DEBUG_MODE=true
        echo NEXT_PUBLIC_LOG_LEVEL=debug
        echo.
        echo # File Upload Configuration
        echo NEXT_PUBLIC_MAX_FILE_SIZE=10485760
        echo NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png
        echo.
        echo # Pagination Configuration
        echo NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20
        echo NEXT_PUBLIC_MAX_PAGE_SIZE=100
        echo.
        echo # Cache Configuration
        echo NEXT_PUBLIC_CACHE_TTL=300000
        echo NEXT_PUBLIC_ENABLE_CACHE=true
    ) > upstar-website\.env.local
    echo [SUCCESS] Frontend environment file created!
) else (
    echo [SUCCESS] Frontend environment file already exists!
)

echo [INFO] Creating necessary directories...
if not exist "upstar-backend\uploads" mkdir upstar-backend\uploads
if not exist "upstar-backend\logs" mkdir upstar-backend\logs
if not exist "upstar-website\logs" mkdir upstar-website\logs

echo [SUCCESS] Setup completed successfully!
echo.
echo Next steps:
echo 1. Review and update environment files:
echo    - upstar-backend\env.local
echo    - upstar-website\.env.local
echo.
echo 2. Start the application:
echo    # Command Prompt 1 - Backend
echo    cd upstar-backend
echo    npm start
echo.
echo    # Command Prompt 2 - Frontend
echo    cd upstar-website
echo    npm run dev
echo.
echo 3. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo    - Health Check: http://localhost:5000/api/health
echo.
echo 4. Test the setup:
echo    cd upstar-backend ^&^& npm run test:db:remote
echo    cd upstar-website ^&^& npm run test:backend
echo.
echo For more information, see SETUP_GUIDE.md
echo.
pause

