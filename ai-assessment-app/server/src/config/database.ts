import { Pool, PoolConfig } from 'pg';

/**
 * Database connection pool configuration
 * Reads connection parameters from environment variables
 */
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,                      // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,     // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
};

/**
 * PostgreSQL connection pool instance
 * This pool will be used throughout the application for database operations
 */
export const pool = new Pool(poolConfig);

/**
 * Health check function to verify database connectivity
 * @returns Promise<boolean> - true if connection is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      // Simple query to verify connection
      await client.query('SELECT 1');
      return true;
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Gracefully close the database pool
 * Should be called when shutting down the application
 */
export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});
