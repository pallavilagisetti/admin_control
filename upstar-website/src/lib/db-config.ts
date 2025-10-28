import { DatabaseConfig } from './database';

// Get database configuration from environment variables
export function getDatabaseConfig(): DatabaseConfig {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

  // Check for required environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: process.env.DB_SSL === 'true' ? true : 
         process.env.DB_SSL === 'false' ? false : 
         process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : false,
    max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 20,
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000,
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : 2000,
  };
}

// Development database configuration (for local development)
export function getDevelopmentConfig(): DatabaseConfig {
  return {
    host: 'localhost',
    port: 5432,
    database: 'resume_db',
    user: 'postgres',
    password: 'password',
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

// Production database configuration
export function getProductionConfig(): DatabaseConfig {
  return getDatabaseConfig();
}

// Test database configuration
export function getTestConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'resume_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 1000,
  };
}

// Get configuration based on environment
export function getConfigForEnvironment(): DatabaseConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return getProductionConfig();
    case 'test':
      return getTestConfig();
    case 'development':
    default:
      return getDevelopmentConfig();
  }
}
