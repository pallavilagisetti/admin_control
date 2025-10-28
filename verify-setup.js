#!/usr/bin/env node

/**
 * Setup Verification Script
 * Verifies that the setup process was completed successfully
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Upstar Admin Panel Setup...\n');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[INFO]${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Check if directory exists
function dirExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

// Check Node.js version
function checkNodeVersion() {
  log('Checking Node.js version...');
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    
    if (majorVersion >= 18) {
      success(`Node.js version ${version} is compatible`);
      return true;
    } else {
      error(`Node.js version ${version} is too old. Version 18+ required.`);
      return false;
    }
  } catch (err) {
    error('Node.js is not installed or not in PATH');
    return false;
  }
}

// Check if dependencies are installed
function checkDependencies() {
  log('Checking dependencies...');
  
  const backendNodeModules = dirExists('upstar-backend/node_modules');
  const frontendNodeModules = dirExists('upstar-website/node_modules');
  
  if (backendNodeModules && frontendNodeModules) {
    success('All dependencies are installed');
    return true;
  } else {
    if (!backendNodeModules) error('Backend dependencies not installed');
    if (!frontendNodeModules) error('Frontend dependencies not installed');
    return false;
  }
}

// Check environment files
function checkEnvironmentFiles() {
  log('Checking environment files...');
  
  const backendEnv = fileExists('upstar-backend/env.local');
  const frontendEnv = fileExists('upstar-website/.env.local');
  
  if (backendEnv && frontendEnv) {
    success('Environment files are configured');
    return true;
  } else {
    if (!backendEnv) error('Backend environment file (env.local) not found');
    if (!frontendEnv) error('Frontend environment file (.env.local) not found');
    return false;
  }
}

// Check if directories exist
function checkDirectories() {
  log('Checking required directories...');
  
  const requiredDirs = [
    'upstar-backend/uploads',
    'upstar-backend/logs',
    'upstar-website/logs'
  ];
  
  let allExist = true;
  
  requiredDirs.forEach(dir => {
    if (dirExists(dir)) {
      success(`Directory exists: ${dir}`);
    } else {
      error(`Directory missing: ${dir}`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Check package.json files
function checkPackageFiles() {
  log('Checking package.json files...');
  
  const backendPackage = fileExists('upstar-backend/package.json');
  const frontendPackage = fileExists('upstar-website/package.json');
  
  if (backendPackage && frontendPackage) {
    success('Package.json files are present');
    return true;
  } else {
    if (!backendPackage) error('Backend package.json not found');
    if (!frontendPackage) error('Frontend package.json not found');
    return false;
  }
}

// Test database connection
function testDatabaseConnection() {
  log('Testing database connection...');
  
  try {
    // Change to backend directory and run test
    process.chdir('upstar-backend');
    const result = execSync('npm run test:db:remote', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 10000 
    });
    
    if (result.includes('✅') || result.includes('SUCCESS')) {
      success('Database connection successful');
      process.chdir('..');
      return true;
    } else {
      warning('Database connection test returned unexpected result');
      process.chdir('..');
      return false;
    }
  } catch (err) {
    warning('Database connection test failed - this may be expected if database is not accessible');
    process.chdir('..');
    return false;
  }
}

// Check if applications can start
function checkApplicationStart() {
  log('Checking if applications can start...');
  
  try {
    // Test backend start (just check if it can load)
    process.chdir('upstar-backend');
    execSync('node -e "require(\'./src/server.js\'); process.exit(0);"', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 5000 
    });
    success('Backend can start successfully');
    process.chdir('..');
    
    // Test frontend build
    process.chdir('upstar-website');
    execSync('npm run build', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 30000 
    });
    success('Frontend can build successfully');
    process.chdir('..');
    
    return true;
  } catch (err) {
    warning('Application start/build test failed - check configuration');
    process.chdir('..');
    return false;
  }
}

// Main verification function
async function verifySetup() {
  console.log('🚀 Upstar Admin Panel Setup Verification');
  console.log('==========================================\n');
  
  const checks = [
    { name: 'Node.js Version', fn: checkNodeVersion },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'Environment Files', fn: checkEnvironmentFiles },
    { name: 'Required Directories', fn: checkDirectories },
    { name: 'Package Files', fn: checkPackageFiles },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Application Start', fn: checkApplicationStart }
  ];
  
  let passed = 0;
  let total = checks.length;
  
  for (const check of checks) {
    console.log(`\n📋 ${check.name}:`);
    if (check.fn()) {
      passed++;
    }
  }
  
  console.log('\n📊 Verification Summary');
  console.log('======================');
  
  if (passed === total) {
    success(`All ${total} checks passed! Setup is complete.`);
    console.log('\n🎉 Your Upstar Admin Panel is ready to use!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start the backend: cd upstar-backend && npm start');
    console.log('2. Start the frontend: cd upstar-website && npm run dev');
    console.log('3. Access the application: http://localhost:3000');
  } else {
    warning(`${passed}/${total} checks passed.`);
    console.log('\n🔧 Please fix the issues above before proceeding.');
    console.log('\n💡 Common solutions:');
    console.log('1. Run the setup script: ./setup.sh (Linux/Mac) or setup.bat (Windows)');
    console.log('2. Install dependencies: npm install in both directories');
    console.log('3. Configure environment files: env.local and .env.local');
    console.log('4. Check database connectivity');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run verification
verifySetup().catch(console.error);

