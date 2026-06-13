import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbQuery } from '../config/db';
import { logSecurityEvent } from '../utils/logger';
import { RequestWithId } from '../middleware/requestLogger';
import { detectSqlInjection } from '../utils/sqlInjectionDetector';

const JWT_SECRET = process.env.JWT_SECRET || 'shopzone_super_secure_jwt_secret_token_key_2026!';

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields (username, password) are required' });
  }

  try {
    // Check if user already exists
    const existingUsers = await dbQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default first user to admin if none exist, or regular user
    const userCount = await dbQuery('SELECT COUNT(*) as count FROM users');
    const role = userCount[0].count === 0 ? 'admin' : 'user';

    // Insert user (email defaults to NULL)
    const result = await dbQuery(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    const userId = result.insertId;

    // Log user creation
    logSecurityEvent('user_creation', `New user registered: ${username}`, {
      actor: { id: userId, username, role },
      ipAddress,
      userAgent,
      details: { email: null }
    });

    // Generate JWT token (email is null for new user)
    const token = jwt.sign({ id: userId, username, email: null, role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, username, email: null, role }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error during registration. Check if database is running.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const requestId = (req as RequestWithId).requestId;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const sqlInjectionMatches = detectSqlInjection({ username, password });
  if (sqlInjectionMatches.length > 0) {
    logSecurityEvent('sql_injection_attempt', `Suspicious SQL injection pattern detected during login for username attempt: ${username}`, {
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

    return res.status(400).json({ error: 'Suspicious input detected' });
  }

  try {
    // Fetch user
    const users = await dbQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      logSecurityEvent('login_failure', `Failed login attempt for non-existent username: ${username}`, {
        actor: { id: null, username, role: 'anonymous' },
        ipAddress,
        userAgent,
        details: { reason: 'User not found' }
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      logSecurityEvent('login_failure', `Failed login attempt (invalid password) for user: ${username}`, {
        actor: { id: user.id, username: user.username, role: user.role },
        ipAddress,
        userAgent,
        details: { reason: 'Invalid password' }
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '24h'
    });

    logSecurityEvent('login_success', `User logged in: ${user.username}`, {
      actor: { id: user.id, username: user.username, role: user.role },
      ipAddress,
      userAgent
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error during login. Check if database is running.' });
  }
};

export const logout = (req: Request, res: Response) => {
  const { username, role } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  logSecurityEvent('logout', `User logged out: ${username || 'anonymous'}`, {
    actor: { id: null, username: username || 'anonymous', role: role || 'anonymous' },
    ipAddress,
    userAgent
  });

  res.json({ message: 'Logout successful' });
};
