import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logSecurityEvent } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'user';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'shopzone_super_secure_jwt_secret_token_key_2026!';

// Middleware to authenticate any request using JWT
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error: any) {
    logSecurityEvent('unauthorized_access', 'Failed JWT verification attempt', {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      details: { error: error.message }
    });
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
};

// Middleware to verify role is Admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    logSecurityEvent('unauthorized_access', 'Non-admin user attempted an administrative action', {
      actor: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      details: { path: req.originalUrl, method: req.method }
    });
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }

  next();
};
