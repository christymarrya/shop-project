import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface RequestWithId extends Request {
  requestId?: string;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const request = req as RequestWithId;
  const incomingRequestId = req.headers['x-request-id'];
  request.requestId = Array.isArray(incomingRequestId)
    ? incomingRequestId[0]
    : incomingRequestId || crypto.randomUUID();
  res.setHeader('x-request-id', request.requestId);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      request_id: request.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown'
    });
  });

  next();
};
