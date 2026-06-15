import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { dbQuery } from '../config/db';

// Get all cart items for current user
export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  try {
    const query = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.sku, p.quantity AS stock_quantity, p.category 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `;
    const items = await dbQuery(query, [user.id]);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch shopping cart' });
  }
};

// Add product to cart (or increment quantity if already exists)
export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity) || 1;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Verify product exists and check stock
    const products = await dbQuery('SELECT name, quantity FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    if (product.quantity < qty) {
      return res.status(400).json({ error: `Only ${product.quantity} units in stock` });
    }

    // Check if item is already in cart
    const existing = await dbQuery('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?', [
      user.id,
      productId
    ]);

    if (existing.length > 0) {
      const newQty = existing[0].quantity + qty;
      if (product.quantity < newQty) {
        return res.status(400).json({ error: `Cannot add more. Max stock available: ${product.quantity}` });
      }
      await dbQuery('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await dbQuery('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [
        user.id,
        productId,
        qty
      ]);
    }

    res.json({ message: 'Product added to cart successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params; // Cart item ID
  const { quantity } = req.body;
  const qty = parseInt(quantity);

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    // Find cart item to get product ID
    const cartItems = await dbQuery('SELECT product_id FROM cart WHERE id = ? AND user_id = ?', [id, user.id]);
    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const productId = cartItems[0].product_id;

    // Check product stock
    const products = await dbQuery('SELECT name, quantity FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Associated product not found' });
    }

    if (products[0].quantity < qty) {
      return res.status(400).json({ error: `Only ${products[0].quantity} units in stock` });
    }

    await dbQuery('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [qty, id, user.id]);
    res.json({ message: 'Cart updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

// Remove item from cart
export const deleteCartItem = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params; // Cart item ID

  try {
    const result = await dbQuery('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json({ message: 'Item removed from cart' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  try {
    await dbQuery('DELETE FROM cart WHERE user_id = ?', [user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};
