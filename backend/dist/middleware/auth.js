"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET || 'shopzone_super_secure_jwt_secret_token_key_2026!';
// Middleware to authenticate any request using JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token is required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        (0, logger_1.logSecurityEvent)('unauthorized_access', 'Failed JWT verification attempt', {
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            details: { error: error.message }
        });
        return res.status(403).json({ error: 'Invalid or expired access token' });
    }
};
exports.authenticateJWT = authenticateJWT;
// Middleware to verify role is Admin
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
        (0, logger_1.logSecurityEvent)('unauthorized_access', 'Non-admin user attempted an administrative action', {
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
exports.requireAdmin = requireAdmin;
