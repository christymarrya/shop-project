import { Request, Response } from 'express';
import { dbQuery } from '../config/db';
import { logSecurityEvent } from '../utils/logger';
import { detectSqlInjection } from '../utils/sqlInjectionDetector';

export const vulnerableLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password must be strings' });
  }

  // 1. Log attempt if SQL injection pattern is detected
  const sqlInjectionMatches = detectSqlInjection({ username, password });
  if (sqlInjectionMatches.length > 0) {
    logSecurityEvent('sql_injection_attempt', `SQL injection attempt detected in Vulnerable demonstration endpoint`, {
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
    const results = await dbQuery(sql);

    if (results.length > 0) {
      return res.json({
        success: true,
        message: 'Access Granted! Demonstrating Vulnerability bypass.',
        user: results[0],
        sql
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid credentials.',
        sql
      });
    }
  } catch (error: any) {
    // Return database error to showcase syntax errors
    return res.status(500).json({
      success: false,
      message: 'Database query execution error',
      error: error.message,
      sql: `SELECT * FROM lab_users WHERE username = '${username}' AND password = '${password}'`
    });
  }
};

export const secureLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password must be strings' });
  }

  // 1. Log attempt if SQL injection pattern is detected
  const sqlInjectionMatches = detectSqlInjection({ username, password });
  if (sqlInjectionMatches.length > 0) {
    logSecurityEvent('sql_injection_attempt', `SQL injection attempt blocked in Secure demonstration endpoint`, {
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
    const results = await dbQuery(sql, [username, password]);

    if (results.length > 0) {
      return res.json({
        success: true,
        message: 'Access Granted! Authenticated using secure parameterized query.',
        user: results[0],
        sql: 'SELECT * FROM lab_users WHERE username = ? AND password = ? (Bind values: ' + JSON.stringify([username, password]) + ')'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid credentials.',
        sql: 'SELECT * FROM lab_users WHERE username = ? AND password = ? (Bind values: ' + JSON.stringify([username, password]) + ')'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
      sql: 'SELECT * FROM lab_users WHERE username = ? AND password = ?'
    });
  }
};
