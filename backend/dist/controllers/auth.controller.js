"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
const sqlInjectionDetector_1 = require("../utils/sqlInjectionDetector");
const JWT_SECRET = process.env.JWT_SECRET || 'shopzone_super_secure_jwt_secret_token_key_2026!';
const register = async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (!username || !password) {
        return res.status(400).json({ error: 'All fields (username, password) are required' });
    }
    try {
        // Check if user already exists
        const existingUsers = await (0, db_1.dbQuery)('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Default first user to admin if none exist, or regular user
        const userCount = await (0, db_1.dbQuery)('SELECT COUNT(*) as count FROM users');
        const role = userCount[0].count === 0 ? 'admin' : 'user';
        // Insert user (email defaults to NULL)
        const result = await (0, db_1.dbQuery)('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        const userId = result.insertId;
        // Log user creation
        (0, logger_1.logSecurityEvent)('user_creation', `New user registered: ${username}`, {
            actor: { id: userId, username, role },
            ipAddress,
            userAgent,
            details: { email: null }
        });
        // Generate JWT token (email is null for new user)
        const token = jsonwebtoken_1.default.sign({ id: userId, username, email: null, role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: userId, username, email: null, role }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error during registration. Check if database is running.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const requestId = req.requestId;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const sqlInjectionMatches = (0, sqlInjectionDetector_1.detectSqlInjection)({ username, password });
    if (sqlInjectionMatches.length > 0) {
        (0, logger_1.logSecurityEvent)('sql_injection_attempt', `Suspicious SQL injection pattern detected during login for username attempt: ${username}`, {
            actor: { id: null, username: 'anonymous', role: 'anonymous' },
            ipAddress,
            userAgent,
            severity: 'high',
            endpoint: req.originalUrl,
            requestId,
            usernameAttempt: String(username),
            details: {
                inspectedFields: ['username', 'password'],
                matches: sqlInjectionMatches
            }
        });
        return res.status(400).json({ error: 'Suspicious input detected.' });
    }
    try {
        // Fetch user
        const users = await (0, db_1.dbQuery)('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            (0, logger_1.logSecurityEvent)('login_failure', `Failed login attempt for non-existent username: ${username}`, {
                actor: { id: null, username, role: 'anonymous' },
                ipAddress,
                userAgent,
                details: { reason: 'User not found' }
            });
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const user = users[0];
        // Verify password
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            (0, logger_1.logSecurityEvent)('login_failure', `Failed login attempt (invalid password) for user: ${username}`, {
                actor: { id: user.id, username: user.username, role: user.role },
                ipAddress,
                userAgent,
                details: { reason: 'Invalid password' }
            });
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, {
            expiresIn: '24h'
        });
        (0, logger_1.logSecurityEvent)('login_success', `User logged in: ${user.username}`, {
            actor: { id: user.id, username: user.username, role: user.role },
            ipAddress,
            userAgent
        });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error during login. Check if database is running.' });
    }
};
exports.login = login;
const logout = (req, res) => {
    const { username, role } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    (0, logger_1.logSecurityEvent)('logout', `User logged out: ${username || 'anonymous'}`, {
        actor: { id: null, username: username || 'anonymous', role: role || 'anonymous' },
        ipAddress,
        userAgent
    });
    res.json({ message: 'Logout successful' });
};
exports.logout = logout;
