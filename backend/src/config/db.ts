import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

let pool: mysql.Pool | null = null;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'cybersec_lab',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  logger.info(`Database pool initialized targeting ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
} catch (error) {
  logger.error('Database pool initialization critical error:', error);
}

// Wrapper for executing SQL queries
export const dbQuery = async (sql: string, params?: any[]): Promise<any> => {
  if (!pool) {
    const errMsg = 'Database pool is uninitialized. Ensure MySQL is running and credentials are set.';
    logger.error(errMsg);
    throw new Error(errMsg);
  }
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error: any) {
    logger.error(`Database query failed. SQL: "${sql}". Error: ${error.message}`);
    throw error;
  }
};

export default pool;
