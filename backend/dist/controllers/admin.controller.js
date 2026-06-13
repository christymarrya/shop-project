"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityEvents = exports.updateUserRole = exports.getDashboardStats = exports.deleteUser = exports.addUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
// List all users (excluding passwords)
const getUsers = async (req, res) => {
    try {
        const users = await (0, db_1.dbQuery)('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
};
exports.getUsers = getUsers;
// Admin adds a user manually
const addUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    const actor = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
    }
    try {
        // Check if username already exists
        const existing = await (0, db_1.dbQuery)('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const finalEmail = email || null;
        const result = await (0, db_1.dbQuery)('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', [username, hashedPassword, finalEmail, role]);
        const newUserId = result.insertId;
        (0, logger_1.logSecurityEvent)('user_creation', `Admin manually created user: ${username} (Role: ${role})`, {
            actor,
            ipAddress,
            userAgent,
            details: { newUserId, username, email: finalEmail, role }
        });
        res.status(201).json({
            message: 'User created successfully',
            user: { id: newUserId, username, email: finalEmail, role }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};
exports.addUser = addUser;
// Admin deletes a user manually
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const actor = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = parseInt(id);
    if (userId === actor.id) {
        return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }
    try {
        // Check if user exists
        const users = await (0, db_1.dbQuery)('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userToDelete = users[0];
        await (0, db_1.dbQuery)('DELETE FROM users WHERE id = ?', [userId]);
        (0, logger_1.logSecurityEvent)('user_deletion', `Admin deleted user: ${userToDelete.username} (ID: ${userId})`, {
            actor,
            ipAddress,
            userAgent,
            details: { deletedUserId: userId, username: userToDelete.username, role: userToDelete.role }
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
// Admin dashboard overview statistics
const getDashboardStats = async (req, res) => {
    const actor = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
        // 1. Total Sales (sum of price_at_purchase * quantity in orders)
        const salesResult = await (0, db_1.dbQuery)('SELECT SUM(price_at_purchase * quantity) as totalSales FROM orders');
        const totalSales = parseFloat(salesResult[0].totalSales || 0).toFixed(2);
        // 2. Total Orders Count (grouped by order_group_id to get actual separate checkouts)
        const orderGroupsResult = await (0, db_1.dbQuery)('SELECT COUNT(DISTINCT order_group_id) as totalOrders FROM orders');
        const totalOrders = orderGroupsResult[0].totalOrders || 0;
        // 3. Total Users Count
        const usersResult = await (0, db_1.dbQuery)('SELECT COUNT(*) as totalUsers FROM users');
        const totalUsers = usersResult[0].totalUsers || 0;
        // 4. Total Products Count
        const productsResult = await (0, db_1.dbQuery)('SELECT COUNT(*) as totalProducts FROM products');
        const totalProducts = productsResult[0].totalProducts || 0;
        // 5. Pending Orders Count
        const pendingResult = await (0, db_1.dbQuery)("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Pending'");
        const pendingOrders = pendingResult[0].count || 0;
        // 6. Processing Orders Count
        const processingResult = await (0, db_1.dbQuery)("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Processing'");
        const processingOrders = processingResult[0].count || 0;
        // 7. Delivered Orders Count
        const deliveredResult = await (0, db_1.dbQuery)("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Delivered'");
        const deliveredOrders = deliveredResult[0].count || 0;
        // 8. Cancelled Orders Count
        const cancelledResult = await (0, db_1.dbQuery)("SELECT COUNT(DISTINCT order_group_id) as count FROM orders WHERE order_status = 'Cancelled'");
        const cancelledOrders = cancelledResult[0].count || 0;
        // Log the admin access to the dashboard stats
        (0, logger_1.logSecurityEvent)('admin_action', `Admin accessed dashboard metrics`, {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
    }
};
exports.getDashboardStats = getDashboardStats;
// Admin changes a user's role
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const actor = req.user;
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
        const users = await (0, db_1.dbQuery)('SELECT id, username, role FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const targetUser = users[0];
        const oldRole = targetUser.role;
        if (oldRole === role) {
            return res.status(400).json({ error: `User role is already "${role}"` });
        }
        await (0, db_1.dbQuery)('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        // Log the user role change security event
        (0, logger_1.logSecurityEvent)('user_role_changed', `User role changed for ${targetUser.username} from ${oldRole} to ${role}`, {
            actor,
            ipAddress,
            userAgent,
            details: { targetUserId: userId, username: targetUser.username, oldRole, newRole: role }
        });
        res.json({ message: 'User role updated successfully', userId, role });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
};
exports.updateUserRole = updateUserRole;
// Admin action: Retrieve all security events / audit logs
const getSecurityEvents = async (req, res) => {
    const { search, eventType, role, username, startDate, endDate } = req.query;
    try {
        let sql = 'SELECT * FROM audit_logs';
        const params = [];
        const clauses = [];
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
        const logs = await (0, db_1.dbQuery)(sql, params);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve security events' });
    }
};
exports.getSecurityEvents = getSecurityEvents;
