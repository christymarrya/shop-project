"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../config/db");
// Ensure logs directory exists relative to the project root
const logsDir = path_1.default.join(process.cwd(), '../logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Log format for Splunk: structured JSON
const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
// Console format: human-readable
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
}));
// Create the logger instance
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: jsonFormat,
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: consoleFormat
        }),
        // Application logs file transport
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'application.json.log'),
            level: 'info'
        }),
        // Dedicated Security/Audit logs transport
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'security.json.log'),
            level: 'warn' // Security events will be logged at 'warn' or higher to separate them
        })
    ]
});
/**
 * Helper to log structured security audit events.
 * Crucial for Splunk ingestion.
 */
const logSecurityEvent = (eventType, message, data) => {
    const actor = data.actor || { id: null, username: 'anonymous', role: 'anonymous' };
    // 1. Log via Winston
    exports.logger.warn(message, {
        event_category: 'security_audit',
        event_type: eventType,
        severity: data.severity,
        timestamp: new Date().toISOString(),
        actor,
        username_attempt: data.usernameAttempt,
        ip_address: data.ipAddress || 'unknown',
        source_ip: data.ipAddress || 'unknown',
        user_agent: data.userAgent || 'unknown',
        endpoint: data.endpoint,
        request_id: data.requestId,
        details: data.details || {}
    });
    // 2. Log to the database (fire-and-forget, non-blocking)
    (0, db_1.dbQuery)('INSERT INTO audit_logs (username, role, event_type, action, ip_address, details) VALUES (?, ?, ?, ?, ?, ?)', [
        data.usernameAttempt || actor.username || 'anonymous',
        actor.role || 'anonymous',
        eventType,
        message,
        data.ipAddress || 'unknown',
        JSON.stringify({
            ...(data.details || {}),
            severity: data.severity,
            endpoint: data.endpoint,
            request_id: data.requestId,
            username_attempt: data.usernameAttempt,
            source_ip: data.ipAddress || 'unknown',
            user_agent: data.userAgent || 'unknown'
        })
    ]).catch((err) => {
        exports.logger.error('Failed to save audit log to database:', err);
    });
};
exports.logSecurityEvent = logSecurityEvent;
