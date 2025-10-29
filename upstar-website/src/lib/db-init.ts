import { DatabaseUtils } from './database';
import { getConfigForEnvironment } from './db-config';

// Initialize database connection
export function initializeDatabase() {
  try {
    const config = getConfigForEnvironment();
    DatabaseUtils.initialize(config);
    console.log('Database connection initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    return false;
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await DatabaseUtils.query('SELECT 1');
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Get database instance (convenience function)
export function getDatabase() {
  return DatabaseUtils.getInstance();
}

















