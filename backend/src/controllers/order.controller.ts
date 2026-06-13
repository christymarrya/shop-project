import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { dbQuery } from '../config/db';
import { logSecurityEvent } from '../utils/logger';
import crypto from 'crypto';

// Checkout current user's cart
// Checkout current user's cart
export const checkout = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // 1. Get all cart items
    const cartQuery = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.quantity AS stock_quantity, p.sku 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `;
    const cartItems = await dbQuery(cartQuery, [user.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // 2. Validate stock for all items
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        logSecurityEvent('checkout', `Failed checkout attempt: Insufficient stock for ${item.name}`, {
          actor: user,
          ipAddress,
          userAgent,
          details: { productId: item.product_id, sku: item.sku, requested: item.quantity, available: item.stock_quantity }
        });
        return res.status(400).json({
          error: `Insufficient stock for product: ${item.name}. Only ${item.stock_quantity} available.`
        });
      }
    }

    // 3. Perform checkout steps (Order Creation, Inventory Deduction, Cart Clearance)
    const orderGroupId = `ORD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    let totalAmount = 0;
    const checkoutDetails: any[] = [];

    for (const item of cartItems) {
      // Deduct stock
      await dbQuery('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
      
      // Log stock change
      logSecurityEvent('stock_changed', `Stock deducted for product (ID: ${item.product_id}): ${item.name} by ${item.quantity} units due to checkout`, {
        actor: { id: user.id, username: user.username, role: user.role },
        ipAddress,
        userAgent,
        details: { productId: item.product_id, quantityDeducted: item.quantity, newQuantity: item.stock_quantity - item.quantity }
      });

      // Create order record with default order_status='Pending' and payment_status='Paid'
      await dbQuery(
        'INSERT INTO orders (user_id, product_id, quantity, price_at_purchase, order_group_id, order_status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, item.product_id, item.quantity, item.price, orderGroupId, 'Pending', 'Paid']
      );

      totalAmount += item.price * item.quantity;
      checkoutDetails.push({
        product_id: item.product_id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price_at_purchase: item.price
      });
    }

    // Clear cart
    await dbQuery('DELETE FROM cart WHERE user_id = ?', [user.id]);

    // Log security audit event for checkout
    logSecurityEvent('checkout', `Successful checkout: ${orderGroupId}`, {
      actor: user,
      ipAddress,
      userAgent,
      details: {
        orderGroupId,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        itemCount: cartItems.length,
        items: checkoutDetails
      }
    });

    // Generate specific order created audit log as requested
    logSecurityEvent('order_created', `Order created successfully: ${orderGroupId}`, {
      actor: user,
      ipAddress,
      userAgent,
      details: {
        orderGroupId,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        itemCount: cartItems.length,
        items: checkoutDetails
      }
    });

    res.json({
      message: 'Checkout successful',
      orderGroupId,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      items: checkoutDetails
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Checkout process failed. Check database logs.' });
  }
};

// Retrieve order history for current user
export const getOrderHistory = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  try {
    const query = `
      SELECT o.id, o.quantity, o.price_at_purchase, o.order_group_id, o.order_date, o.order_status, o.payment_status, p.name, p.sku, p.category, p.image_url 
      FROM orders o 
      JOIN products p ON o.product_id = p.id 
      WHERE o.user_id = ? 
      ORDER BY o.order_date DESC
    `;
    const orders = await dbQuery(query, [user.id]);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
};

// Admin action: Retrieve all orders placed on the system with search & status filters
export const getAllOrders = async (req: AuthenticatedRequest, res: Response) => {
  const { search, status } = req.query;

  try {
    let sql = `
      SELECT o.id, o.quantity, o.price_at_purchase, o.order_group_id, o.order_date, o.order_status, o.payment_status, p.name, p.sku, p.image_url, u.username, u.email 
      FROM orders o 
      JOIN products p ON o.product_id = p.id 
      JOIN users u ON o.user_id = u.id
    `;
    const params: any[] = [];
    const clauses: string[] = [];

    if (status) {
      clauses.push('o.order_status = ?');
      params.push(status);
    }

    if (search) {
      clauses.push('(o.order_group_id LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.name LIKE ? OR p.sku LIKE ?)');
      const searchVal = `%${search}%`;
      params.push(searchVal, searchVal, searchVal, searchVal, searchVal);
    }

    if (clauses.length > 0) {
      sql += ' WHERE ' + clauses.join(' AND ');
    }

    sql += ' ORDER BY o.order_date DESC';

    const orders = await dbQuery(sql, params);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Admin action: Update order status for all items in an order group
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { orderGroupId } = req.params;
  const { status, paymentStatus } = req.body;
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const allowedStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    // Check if order group exists
    const orders = await dbQuery('SELECT id, order_status, payment_status FROM orders WHERE order_group_id = ?', [orderGroupId]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order group not found' });
    }

    const oldStatus = orders[0].order_status;
    const oldPaymentStatus = orders[0].payment_status;

    let updateSql = 'UPDATE orders SET order_status = ?';
    const params = [status];

    if (paymentStatus) {
      updateSql += ', payment_status = ?';
      params.push(paymentStatus);
    }
    updateSql += ' WHERE order_group_id = ?';
    params.push(orderGroupId);

    await dbQuery(updateSql, params);

    // Audit logs
    logSecurityEvent('order_status_changed', `Order status changed for ${orderGroupId} from ${oldStatus} to ${status}`, {
      actor,
      ipAddress,
      userAgent,
      details: { orderGroupId, oldStatus, newStatus: status, oldPaymentStatus, newPaymentStatus: paymentStatus || oldPaymentStatus }
    });

    logSecurityEvent('admin_order_update', `Admin updated order status for ${orderGroupId} to ${status}`, {
      actor,
      ipAddress,
      userAgent,
      details: { orderGroupId, status, paymentStatus }
    });

    res.json({ message: 'Order status updated successfully', orderGroupId, status });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// User/Admin action: Cancel a pending/processing order, restoring inventory
export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { orderGroupId } = req.params;
  const actor = req.user!;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Fetch items in the order group
    const items = await dbQuery('SELECT id, product_id, quantity, order_status, user_id FROM orders WHERE order_group_id = ?', [orderGroupId]);
    if (items.length === 0) {
      return res.status(404).json({ error: 'Order group not found' });
    }

    // Verify ownership or check if admin
    if (items[0].user_id !== actor.id && actor.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Cannot cancel this order' });
    }

    const currentStatus = items[0].order_status;
    if (currentStatus === 'Cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }
    if (currentStatus === 'Delivered' || currentStatus === 'Shipped' || currentStatus === 'Out for Delivery') {
      return res.status(400).json({ error: 'Cannot cancel order that has been shipped, delivered, or out for delivery' });
    }

    // Restore stock for all items
    for (const item of items) {
      await dbQuery('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.product_id]);

      // Log stock change
      logSecurityEvent('stock_changed', `Stock restored for product (ID: ${item.product_id}) by ${item.quantity} units due to order cancellation`, {
        actor: { id: actor.id, username: actor.username, role: actor.role },
        ipAddress,
        userAgent,
        details: { productId: item.product_id, quantityRestored: item.quantity }
      });
    }

    // Update status to Cancelled
    await dbQuery("UPDATE orders SET order_status = 'Cancelled' WHERE order_group_id = ?", [orderGroupId]);

    // Audit logs
    logSecurityEvent('order_cancelled', `Order cancelled: ${orderGroupId}`, {
      actor,
      ipAddress,
      userAgent,
      details: { orderGroupId, previousStatus: currentStatus }
    });

    logSecurityEvent('order_status_changed', `Order status changed for ${orderGroupId} from ${currentStatus} to Cancelled`, {
      actor,
      ipAddress,
      userAgent,
      details: { orderGroupId, oldStatus: currentStatus, newStatus: 'Cancelled' }
    });

    res.json({ message: 'Order cancelled successfully', orderGroupId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};
