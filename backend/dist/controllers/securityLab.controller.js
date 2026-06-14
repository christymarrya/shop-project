"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureLogin = exports.vulnerableLogin = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
const sqlInjectionDetector_1 = require("../utils/sqlInjectionDetector");
const vulnerableLogin = async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Username and password must be strings' });
    }
    // 1. Log attempt if SQL injection pattern is detected
    const sqlInjectionMatches = (0, sqlInjectionDetector_1.detectSqlInjection)({ username, password });
    if (sqlInjectionMatches.length > 0) {
        (0, logger_1.logSecurityEvent)('sql_injection_attempt', `SQL injection attempt detected in Vulnerable demonstration endpoint`, {
            actor: { id: null, username: 'anonymous', role: 'anonymous' },
            ipAddress,
            userAgent,
            severity: 'high',
            endpoint: req.originalUrl,
            usernameAttempt: String(username),
            details: {
                mode: 'vulnerable_lab',
                matches: sqlInjectionMatches,
                inspectedFields: ['username', 'password']
            }
        });
    }
    try {
        // String concatenation (vulnerable version query)
        const sql = `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`;
        const results = await (0, db_1.dbQuery)(sql);
        if (results.length > 0) {
            return res.json({
                success: true,
                message: 'Access Granted! Demonstrating Vulnerability bypass.',
                user: results[0],
                sql
            });
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Access Denied: Invalid credentials.',
                sql
            });
        }
    }
    catch (error) {
        // Return database error to showcase syntax errors
        return res.status(500).json({
            success: false,
            message: 'Database query execution error',
            error: error.message,
            sql: `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`
        });
    }
};
exports.vulnerableLogin = vulnerableLogin;
const secureLogin = async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Username and password must be strings' });
    }
    // 1. Log attempt if SQL injection pattern is detected
    const sqlInjectionMatches = (0, sqlInjectionDetector_1.detectSqlInjection)({ username, password });
    if (sqlInjectionMatches.length > 0) {
        (0, logger_1.logSecurityEvent)('sql_injection_attempt', `SQL injection attempt blocked in Secure demonstration endpoint`, {
            actor: { id: null, username: 'anonymous', role: 'anonymous' },
            ipAddress,
            userAgent,
            severity: 'high',
            endpoint: req.originalUrl,
            usernameAttempt: String(username),
            details: {
                mode: 'secure_lab',
                matches: sqlInjectionMatches,
                inspectedFields: ['username', 'password']
            }
        });
    }
    try {
        // Parameterized queries (secure version)
        const sql = 'SELECT * FROM lab_users WHERE username = ? AND password = ?';
        const results = await (0, db_1.dbQuery)(sql, [username, password]);
        if (results.length > 0) {
            return res.json({
                success: true,
                message: 'Access Granted! Authenticated using secure parameterized query.',
                user: results[0],
                sql: 'SELECT * FROM lab_users WHERE username = ? AND password = ? (Bind values: ' + JSON.stringify([username, password]) + ')'
            });
        }
        else {
            return res.status(401).json({
                success: false,
                message: 'Access Denied: Invalid credentials.',
                sql: 'SELECT * FROM lab_users WHERE username = ? AND password = ? (Bind values: ' + JSON.stringify([username, password]) + ')'
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Database error',
            error: error.message,
            sql: 'SELECT * FROM lab_users WHERE username = ? AND password = ?'
        });
    }
};
exports.secureLogin = secureLogin;
