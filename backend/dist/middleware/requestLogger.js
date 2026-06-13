"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const request = req;
    const incomingRequestId = req.headers['x-request-id'];
    request.requestId = Array.isArray(incomingRequestId)
        ? incomingRequestId[0]
        : incomingRequestId || crypto_1.default.randomUUID();
    res.setHeader('x-request-id', request.requestId);
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
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
exports.requestLogger = requestLogger;
