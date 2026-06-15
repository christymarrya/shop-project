import { Request, Response, NextFunction } from 'express';
import { detectSqlInjection } from '../utils/sqlInjectionDetector';
import { detectXss } from '../utils/xssDetector';
import { logSecurityEvent } from '../utils/logger';

export const securityScanner = (req: Request, res: Response, next: NextFunction) => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Extract a username attempt if available in req.body or req.query
  const usernameAttempt = req.body?.username || req.query?.username || req.body?.email || req.query?.email || '';

  // Helper to recursively scan keys/values
  const scan = (obj: any, parentKey: string = '') => {
    if (!obj) return;
    
    if (typeof obj === 'string') {
      const lowerKey = parentKey.toLowerCase();
      
      // 1. SQL Injection check for username, email, search, password, login inputs
      const isSqlInput = ['username', 'email', 'search', 'password', 'login'].some(k => lowerKey.includes(k));
      if (isSqlInput) {
        const sqlMatches = detectSqlInjection({ username: obj });
        if (sqlMatches.length > 0) {
          logSecurityEvent('sql_injection_attempt', 'Possible SQL Injection detected', {
            ipAddress,
            userAgent,
            usernameAttempt: String(usernameAttempt || 'anonymous'),
            payload: obj,
            details: {
              field: parentKey,
              matches: sqlMatches
            }
          });
        }
      }

      // 2. XSS check for all user inputs
      if (detectXss(obj)) {
        logSecurityEvent('xss_attempt', 'Possible XSS attack detected', {
          ipAddress,
          userAgent,
          usernameAttempt: String(usernameAttempt || 'anonymous'),
          payload: obj,
          details: {
            field: parentKey
          }
        });
      }
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        scan(obj[key], key);
      }
    }
  };

  // Scan body, query, and params
  scan(req.body, 'body');
  scan(req.query, 'query');
  scan(req.params, 'params');

  next();
};
