import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { dbQuery } from '../config/db';

// Ensure logs directory exists relative to the project root
const logsDir = path.join(process.cwd(), '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log format for Splunk: structured JSON
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Console format: human-readable
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Create the logger instance
export const logger = winston.createLogger({
  level: 'info',
  format: jsonFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Application logs file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'application.json.log'),
      level: 'info'
    }),
    // Dedicated Security/Audit logs transport
    new winston.transports.File({
      filename: path.join(logsDir, 'security.json.log'),
      level: 'warn' // Security events will be logged at 'warn' or higher to separate them
    })
  ]
});

export interface SecurityEventData {
  actor?: {
    id: number | null;
    username: string;
    role: string;
  };
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Helper to log structured security audit events.
 * Crucial for Splunk ingestion.
 */
export const logSecurityEvent = (
  eventType:
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'user_creation'
    | 'user_deletion'
    | 'user_role_changed'
    | 'product_creation'
    | 'product_deletion'
    | 'product_update'
    | 'price_changed'
    | 'stock_changed'
    | 'checkout'
    | 'admin_action'
    | 'unauthorized_access'
    | 'order_created'
    | 'order_status_changed'
    | 'order_cancelled'
    | 'admin_order_update',
  message: string,
  data: SecurityEventData
) => {
  // 1. Log via Winston
  logger.warn(message, {
    event_category: 'security_audit',
    event_type: eventType,
    timestamp: new Date().toISOString(),
    actor: data.actor || { id: null, username: 'anonymous', role: 'anonymous' },
    ip_address: data.ipAddress || 'unknown',
    user_agent: data.userAgent || 'unknown',
    details: data.details || {}
  });

  // 2. Log to the database (fire-and-forget, non-blocking)
  dbQuery(
    'INSERT INTO audit_logs (username, role, event_type, action, ip_address, details) VALUES (?, ?, ?, ?, ?, ?)',
    [
      data.actor?.username || 'anonymous',
      data.actor?.role || 'anonymous',
      eventType,
      message,
      data.ipAddress || 'unknown',
      JSON.stringify(data.details || {})
    ]
  ).catch((err) => {
    logger.error('Failed to save audit log to database:', err);
  });
};
