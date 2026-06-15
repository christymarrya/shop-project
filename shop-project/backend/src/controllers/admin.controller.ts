import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { dbQuery } from '../config/db';
import { logSecurityEvent } from '../utils/logger';

// List all users (excluding passwords)
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await dbQuery('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Admin adds a user manually
export const addUser = async (req: AuthenticatedRequest, res: Response) => {
  const { username, email, password, role } = req.body;
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, email, password, and role are required' });
  }

  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
  }

  try {
    // Check if user already exists
    const existing = await dbQuery('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbQuery(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, role]
    );

    const newUserId = result.insertId;

    logSecurityEvent('user_creation', `Admin manually created user: ${username} (Role: ${role})`, {
      actor,
      ipAddress,
      userAgent,
      details: { newUserId, username, email, role }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUserId, username, email, role }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user' });
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
    const users = await dbQuery('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
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
