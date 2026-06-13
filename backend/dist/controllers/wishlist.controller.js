"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const db_1 = require("../config/db");
// Get user's wishlist
const getWishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const wishlist = await (0, db_1.dbQuery)(`SELECT w.id as wishlist_entry_id, p.* 
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`, [userId]);
        res.json(wishlist);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve wishlist' });
    }
};
exports.getWishlist = getWishlist;
// Add product to wishlist
const addToWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }
    try {
        // Check if product exists
        const products = await (0, db_1.dbQuery)('SELECT id FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Insert user_id and product_id (ignoring duplicates via unique constraints)
        await (0, db_1.dbQuery)('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id', [userId, productId]);
        res.status(201).json({ message: 'Product added to wishlist successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add product to wishlist' });
    }
};
exports.addToWishlist = addToWishlist;
// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;
    try {
        await (0, db_1.dbQuery)('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
        res.json({ message: 'Product removed from wishlist successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove product from wishlist' });
    }
};
exports.removeFromWishlist = removeFromWishlist;
