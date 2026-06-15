"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.deleteCartItem = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const db_1 = require("../config/db");
// Get all cart items for current user
const getCart = async (req, res) => {
    const user = req.user;
    try {
        const query = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.sku, p.quantity AS stock_quantity, p.category 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `;
        const items = await (0, db_1.dbQuery)(query, [user.id]);
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch shopping cart' });
    }
};
exports.getCart = getCart;
// Add product to cart (or increment quantity if already exists)
const addToCart = async (req, res) => {
    const user = req.user;
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }
    try {
        // Verify product exists and check stock
        const products = await (0, db_1.dbQuery)('SELECT name, quantity FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const product = products[0];
        if (product.quantity < qty) {
            return res.status(400).json({ error: `Only ${product.quantity} units in stock` });
        }
        // Check if item is already in cart
        const existing = await (0, db_1.dbQuery)('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?', [
            user.id,
            productId
        ]);
        if (existing.length > 0) {
            const newQty = existing[0].quantity + qty;
            if (product.quantity < newQty) {
                return res.status(400).json({ error: `Cannot add more. Max stock available: ${product.quantity}` });
            }
            await (0, db_1.dbQuery)('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
        }
        else {
            await (0, db_1.dbQuery)('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [
                user.id,
                productId,
                qty
            ]);
        }
        res.json({ message: 'Product added to cart successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};
exports.addToCart = addToCart;
// Update cart item quantity
const updateCartItem = async (req, res) => {
    const user = req.user;
    const { id } = req.params; // Cart item ID
    const { quantity } = req.body;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }
    try {
        // Find cart item to get product ID
        const cartItems = await (0, db_1.dbQuery)('SELECT product_id FROM cart WHERE id = ? AND user_id = ?', [id, user.id]);
        if (cartItems.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        const productId = cartItems[0].product_id;
        // Check product stock
        const products = await (0, db_1.dbQuery)('SELECT name, quantity FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Associated product not found' });
        }
        if (products[0].quantity < qty) {
            return res.status(400).json({ error: `Only ${products[0].quantity} units in stock` });
        }
        await (0, db_1.dbQuery)('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [qty, id, user.id]);
        res.json({ message: 'Cart updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update cart' });
    }
};
exports.updateCartItem = updateCartItem;
// Remove item from cart
const deleteCartItem = async (req, res) => {
    const user = req.user;
    const { id } = req.params; // Cart item ID
    try {
        const result = await (0, db_1.dbQuery)('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, user.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        res.json({ message: 'Item removed from cart' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};
exports.deleteCartItem = deleteCartItem;
// Clear entire cart
const clearCart = async (req, res) => {
    const user = req.user;
    try {
        await (0, db_1.dbQuery)('DELETE FROM cart WHERE user_id = ?', [user.id]);
        res.json({ message: 'Cart cleared' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};
exports.clearCart = clearCart;
