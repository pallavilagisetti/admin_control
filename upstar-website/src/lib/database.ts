import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Database configuration interface
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Database connection class
export class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl || false,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  // Singleton pattern to ensure single connection pool
  public static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        throw new Error('Database configuration is required for first initialization');
      }
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  // Get a client from the pool
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Execute a query with automatic client management
  public async query<T extends QueryResultRow = any>(
    text: string, 
    params?: any[]
  ): Promise<QueryResult<T>> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  // Execute multiple queries in a transaction
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Close the connection pool
  public async close(): Promise<void> {
    await this.pool.end();
  }

  // Get pool statistics
  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

// Database utility functions
export class DatabaseUtils {
  private static db: DatabaseConnection;

  // Initialize database connection
  public static initialize(config: DatabaseConfig): void {
    this.db = DatabaseConnection.getInstance(config);
  }

  // Get database instance
  public static getInstance(): DatabaseConnection {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Execute a simple query
  public static async query<T extends QueryResultRow = any>(
    text: string, 
    params?: any[]
  ): Promise<QueryResult<T>> {
    return await this.getInstance().query(text, params);
  }

  // Execute a query in a transaction
  public static async queryTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    return await this.getInstance().transaction(callback);
  }
}

// Export default database instance getter
export const getDatabase = () => DatabaseUtils.getInstance();
