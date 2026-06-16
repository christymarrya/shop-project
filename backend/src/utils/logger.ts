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

// Log format for Splunk: key-value pairs in a standard .log file
const splunkKeyValueFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const formatValue = (val: any): string => {
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '\\"')}"`;
      }
      return `"${String(val).replace(/"/g, '\\"')}"`;
    };
    
    // Flatten nested objects like actor for easier Splunk querying
    const flatMeta: Record<string, any> = {};
    Object.entries(meta).forEach(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.entries(val).forEach(([nestedKey, nestedVal]) => {
          flatMeta[`${key}_${nestedKey}`] = nestedVal;
        });
      } else {
        flatMeta[key] = val;
      }
    });

    const metaPairs = Object.entries(flatMeta)
      .map(([key, val]) => `${key}=${formatValue(val)}`)
      .join(' ');

    return `${timestamp} level="${level}" message="${message.replace(/"/g, '\\"')}" ${metaPairs}`;
  })
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
    // Application logs file transport (JSON)
    new winston.transports.File({
      filename: path.join(logsDir, 'application.json.log'),
      level: 'info'
    }),
    // Dedicated Security/Audit logs transport (JSON)
    new winston.transports.File({
      filename: path.join(logsDir, 'security.json.log'),
      level: 'warn'
    }),
    // Application logs file transport (Splunk Key-Value text)
    new winston.transports.File({
      filename: path.join(logsDir, 'application.log'),
      level: 'info',
      format: splunkKeyValueFormat
    }),
    // Dedicated Security/Audit logs transport (Splunk Key-Value text)
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      format: splunkKeyValueFormat
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
  severity?: 'low' | 'medium' | 'high' | 'critical';
  endpoint?: string;
  requestId?: string;
  usernameAttempt?: string;
  payload?: string;
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
    | 'admin_order_update'
    | 'sql_injection_attempt'
    | 'xss_attempt',
  message: string,
  data: SecurityEventData
) => {
  const actor = data.actor || { id: null, username: 'anonymous', role: 'anonymous' };

  // Determine severity based on requirement 4 mapping
  let severity = 'low';
  if (['login_success', 'user_creation', 'checkout'].includes(eventType)) {
    severity = 'low';
  } else if (['login_failure', 'unauthorized_access'].includes(eventType)) {
    severity = 'medium';
  } else if (['sql_injection_attempt', 'xss_attempt', 'product_deletion', 'user_deletion'].includes(eventType)) {
    severity = 'high';
  } else if (data.severity) {
    severity = data.severity;
  }

  const usernameVal = data.usernameAttempt || actor.username || "";
  const userIdVal = actor.id !== null && actor.id !== undefined ? String(actor.id) : "";

  // 1. Log via Winston
  logger.warn(message, {
    event_type: eventType,
    event_category: 'security_audit',
    severity,
    timestamp: new Date().toISOString(),
    username: usernameVal,
    user_id: userIdVal,
    ip_address: data.ipAddress || 'unknown',
    user_agent: data.userAgent || 'unknown',

    // Keep other existing properties for backward compatibility
    actor,
    username_attempt: data.usernameAttempt,
    source_ip: data.ipAddress || 'unknown',
    endpoint: data.endpoint,
    request_id: data.requestId,
    payload: data.payload,
    details: data.details || {}
  });

  // 2. Log to the database (fire-and-forget, non-blocking)
  dbQuery(
    'INSERT INTO audit_logs (username, role, event_type, action, ip_address, details) VALUES (?, ?, ?, ?, ?, ?)',
    [
      usernameVal || 'anonymous',
      actor.role || 'anonymous',
      eventType,
      message,
      data.ipAddress || 'unknown',
      JSON.stringify({
        ...(data.details || {}),
        severity,
        endpoint: data.endpoint,
        request_id: data.requestId,
        username_attempt: data.usernameAttempt,
        source_ip: data.ipAddress || 'unknown',
        user_agent: data.userAgent || 'unknown',
        payload: data.payload,
        username: usernameVal,
        user_id: userIdVal
      })
    ]
  ).catch((err) => {
    logger.error('Failed to save audit log to database:', err);
  });
};
