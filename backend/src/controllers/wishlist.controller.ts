import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { dbQuery } from '../config/db';

// Get user's wishlist
export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const wishlist = await dbQuery(
      `SELECT w.id as wishlist_entry_id, p.* 
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(wishlist);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
};

// Add product to wishlist
export const addToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Check if product exists
    const products = await dbQuery('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Insert user_id and product_id (ignoring duplicates via unique constraints)
    await dbQuery(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id',
      [userId, productId]
    );

    res.status(201).json({ message: 'Product added to wishlist successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add product to wishlist' });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.params;

  try {
    await dbQuery(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    res.json({ message: 'Product removed from wishlist successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove product from wishlist' });
  }
};
