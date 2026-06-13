import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { dbQuery } from '../config/db';
import { logSecurityEvent, logger } from '../utils/logger';

// List all users (excluding passwords)
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await dbQuery('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Admin adds a user manually
export const addUser = async (req: AuthenticatedRequest, res: Response) => {
  const { username, password, role } = req.body;
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const normalizedUsername = typeof username === 'string' ? username.trim() : '';

  if (!normalizedUsername || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
  }

  try {
    // Check if username already exists
    const existing = await dbQuery('SELECT id FROM users WHERE username = ?', [normalizedUsername]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbQuery(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [normalizedUsername, hashedPassword, role]
    );

    const newUserId = result.insertId;

    logSecurityEvent('user_creation', `Admin manually created user: ${normalizedUsername} (Role: ${role})`, {
      actor,
      ipAddress,
      userAgent,
      details: { newUserId, username: normalizedUsername, role }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUserId, username: normalizedUsername, role }
    });
  } catch (error: any) {
    logger.error('Failed to manually create user:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists' });
    }

    res.status(500).json({ error: 'Database error while creating user' });
  }
};

// Admin deletes a user manually
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const userId = parseInt(id);

  if (userId === actor.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account' });
  }

  try {
    // Check if user exists
    const users = await dbQuery('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = users[0];

    await dbQuery('DELETE FROM users WHERE id = ?', [userId]);

    logSecurityEvent('user_deletion', `Admin deleted user: ${userToDelete.username} (ID: ${userId})`, {
      actor,
      ipAddress,
      userAgent,
      details: { deletedUserId: userId, username: userToDelete.username, role: userToDelete.role }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Admin dashboard overview statistics
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // 1. Total Sales (sum of price_at_purchase * quantity in orders)
    const salesResult = await dbQuery('SELECT SUM(price_at_purchase * quantity) as totalSales FROM orders');
    const totalSales = parseFloat(salesResult[0].totalSales || 0).toFixed(2);

    // 2. Total Orders Count (grouped by order_group_id to get actual separate checkouts)
    const orderGroupsResult = await dbQuery('SELECT COUNT(DISTINCT order_group_id) as totalOrders FROM orders');
    const totalOrders = orderGroupsResult[0].totalOrders || 0;

    // 3. Total Users Count
    const usersResult = await dbQuery('SELECT COUNT(*) as totalUsers FROM users');
    const totalUsers = usersResult[0].totalUsers || 0;

    // 4. Total Products Count
    const productsResult = await dbQuery('SELECT COUNT(*) as totalProducts FROM products');
    const totalProducts = productsResult[0].totalProducts || 0;

    // 5. Pending Orders Count
    const pendingResult = await dbQuery("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Pending'");
    const pendingOrders = pendingResult[0].count || 0;

    // 6. Processing Orders Count
    const processingResult = await dbQuery("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Processing'");
    const processingOrders = processingResult[0].count || 0;

    // 7. Delivered Orders Count
    const deliveredResult = await dbQuery("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Delivered'");
    const deliveredOrders = deliveredResult[0].count || 0;

    // 8. Cancelled Orders Count
    const cancelledResult = await dbQuery("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Cancelled'");
    const cancelledOrders = cancelledResult[0].count || 0;

    // Log the admin access to the dashboard stats
    logSecurityEvent('admin_action', `Admin accessed dashboard metrics`, {
      actor,
      ipAddress,
      userAgent
    });

    res.json({
      totalSales: parseFloat(totalSales),
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
};

// Admin changes a user's role
export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const userId = parseInt(id);

  if (userId === actor.id) {
    return res.status(400).json({ error: 'You cannot change your own admin account role' });
  }

  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
  }

  try {
    // Check if user exists
    const users = await dbQuery('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = users[0];
    const oldRole = targetUser.role;

    if (oldRole === role) {
      return res.status(400).json({ error: `User role is already "${role}"` });
    }

    await dbQuery('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    // Log the user role change security event
    logSecurityEvent('user_role_changed', `User role changed for ${targetUser.username} from ${oldRole} to ${role}`, {
      actor,
      ipAddress,
      userAgent,
      details: { targetUserId: userId, username: targetUser.username, oldRole, newRole: role }
    });

    res.json({ message: 'User role updated successfully', userId, role });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Admin action: Retrieve all security events / audit logs
export const getSecurityEvents = async (req: AuthenticatedRequest, res: Response) => {
  const { search, eventType, role, username, startDate, endDate } = req.query;

  try {
    let sql = 'SELECT * FROM audit_logs';
    const params: any[] = [];
    const clauses: string[] = [];

    if (eventType) {
      clauses.push('event_type = ?');
      params.push(eventType);
    }

    if (role) {
      clauses.push('role = ?');
      params.push(role);
    }

    if (username) {
      clauses.push('username = ?');
      params.push(username);
    }

    if (startDate) {
      clauses.push('timestamp >= ?');
      params.push(startDate);
    }

    if (endDate) {
      clauses.push('timestamp <= ?');
      params.push(endDate);
    }

    if (search) {
      clauses.push('(username LIKE ? OR action LIKE ? OR ip_address LIKE ? OR event_type LIKE ? OR role LIKE ?)');
      const searchVal = `%${search}%`;
      params.push(searchVal, searchVal, searchVal, searchVal, searchVal);
    }

    if (clauses.length > 0) {
      sql += ' WHERE ' + clauses.join(' AND ');
    }

    sql += ' ORDER BY timestamp DESC';

    const logs = await dbQuery(sql, params);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve security events' });
  }
};
