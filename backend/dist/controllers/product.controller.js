"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'shopzone_super_secure_jwt_secret_token_key_2026!';
// Public storefront: List all products (with search, category, pricing, featured filters and sorting)
const getProducts = async (req, res) => {
    const { search, category, minPrice, maxPrice, sort, featured } = req.query;
    // Optional Admin JWT Token extraction to allow viewing hidden items
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (decoded && decoded.role === 'admin') {
                isAdmin = true;
            }
        }
        catch (err) {
            // Ignore invalid token and treat as guest
        }
    }
    try {
        let sql = 'SELECT * FROM products';
        const params = [];
        const clauses = [];
        // Guest users should only see active products
        if (!isAdmin) {
            clauses.push("status = 'active'");
        }
        else {
            const { status } = req.query;
            if (status) {
                clauses.push("status = ?");
                params.push(status);
            }
        }
        if (search) {
            clauses.push('(name LIKE ? OR description LIKE ? OR sku LIKE ? OR brand LIKE ?)');
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal, searchVal);
        }
        if (category) {
            clauses.push('category = ?');
            params.push(category);
        }
        if (minPrice !== undefined && minPrice !== '') {
            clauses.push('price >= ?');
            params.push(parseFloat(minPrice));
        }
        if (maxPrice !== undefined && maxPrice !== '') {
            clauses.push('price <= ?');
            params.push(parseFloat(maxPrice));
        }
        if (featured === 'true' || featured === '1') {
            clauses.push('featured = 1');
        }
        if (clauses.length > 0) {
            sql += ' WHERE ' + clauses.join(' AND ');
        }
        // Sorting parameters
        let orderBy = 'id DESC';
        if (sort) {
            if (sort === 'price_asc') {
                orderBy = 'price ASC';
            }
            else if (sort === 'price_desc') {
                orderBy = 'price DESC';
            }
            else if (sort === 'rating') {
                orderBy = 'rating DESC';
            }
            else if (sort === 'newest') {
                orderBy = 'created_at DESC';
            }
        }
        sql += ' ORDER BY ' + orderBy;
        const products = await (0, db_1.dbQuery)(sql, params);
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
// Public storefront: Get a single product
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const products = await (0, db_1.dbQuery)('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(products[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};
exports.getProductById = getProductById;
// Admin action: Create a product
const createProduct = async (req, res) => {
    const { name, description, category, price, quantity, sku, image_url, gallery_urls, brand, mrp, discount_percent, stock_status, rating, reviews_count, tags, specifications, featured, status } = req.body;
    const actor = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    if (!name || !category || price === undefined || quantity === undefined || !sku) {
        return res.status(400).json({ error: 'Name, category, price, quantity, and SKU are required' });
    }
    try {
        // Check unique SKU
        const existingSku = await (0, db_1.dbQuery)('SELECT id FROM products WHERE sku = ?', [sku]);
        if (existingSku.length > 0) {
            return res.status(400).json({ error: 'A product with this SKU already exists' });
        }
        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity);
        const parsedMrp = (mrp !== undefined && mrp !== '') ? parseFloat(mrp) : parsedPrice;
        let parsedDiscount = 0;
        if (parsedMrp > parsedPrice) {
            parsedDiscount = Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100);
        }
        else if (discount_percent !== undefined && discount_percent !== '') {
            parsedDiscount = parseInt(discount_percent);
        }
        const calculatedStockStatus = parsedQuantity > 0 ? 'In Stock' : 'Out of Stock';
        const finalStockStatus = stock_status || calculatedStockStatus;
        // Use uploaded image file path if provided, otherwise default to manually entered image_url string
        let imagePath = '';
        if (req.file) {
            imagePath = `/uploads/product-images/${req.file.filename}`;
        }
        else if (image_url) {
            imagePath = image_url;
        }
        const result = await (0, db_1.dbQuery)(`INSERT INTO products (
        name, description, category, price, quantity, sku, 
        image_url, gallery_urls, brand, mrp, discount_percent, 
        stock_status, rating, reviews_count, tags, specifications, 
        featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            name,
            description || '',
            category,
            parsedPrice,
            parsedQuantity,
            sku,
            imagePath,
            gallery_urls || '',
            brand || '',
            parsedMrp,
            parsedDiscount,
            finalStockStatus,
            (rating !== undefined && rating !== '') ? parseFloat(rating) : 4.0,
            (reviews_count !== undefined && reviews_count !== '') ? parseInt(reviews_count) : 0,
            tags || '',
            specifications || '',
            (featured === true || featured === 1 || featured === 'true' || featured === '1') ? 1 : 0,
            status || 'active'
        ]);
        const productId = result.insertId;
        (0, logger_1.logSecurityEvent)('product_creation', `Product created: ${name} (SKU: ${sku})`, {
            actor,
            ipAddress,
            userAgent,
            details: { productId, name, price: parsedPrice, quantity: parsedQuantity, sku }
        });
        res.status(201).json({
            message: 'Product created successfully',
            product: {
                id: productId,
                name,
                description,
                category,
                price: parsedPrice,
                quantity: parsedQuantity,
                sku,
                image_url: imagePath,
                gallery_urls,
                brand,
                mrp: parsedMrp,
                discount_percent: parsedDiscount,
                stock_status: finalStockStatus,
                rating: (rating !== undefined && rating !== '') ? parseFloat(rating) : 4.0,
                reviews_count: (reviews_count !== undefined && reviews_count !== '') ? parseInt(reviews_count) : 0,
                tags,
                specifications,
                featured,
                status
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
// Admin action: Update a product
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, category, price, quantity, sku, image_url, gallery_urls, brand, mrp, discount_percent, stock_status, rating, reviews_count, tags, specifications, featured, status } = req.body;
    const actor = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
        const products = await (0, db_1.dbQuery)('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const originalProduct = products[0];
        // If SKU is being updated, verify it is unique
        if (sku && sku !== originalProduct.sku) {
            const existingSku = await (0, db_1.dbQuery)('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, id]);
            if (existingSku.length > 0) {
                return res.status(400).json({ error: 'A product with this SKU already exists' });
            }
        }
        const finalName = name !== undefined ? name : originalProduct.name;
        const finalDescription = description !== undefined ? description : originalProduct.description;
        const finalCategory = category !== undefined ? category : originalProduct.category;
        const finalPrice = (price !== undefined && price !== '') ? parseFloat(price) : parseFloat(originalProduct.price);
        const finalQuantity = (quantity !== undefined && quantity !== '') ? parseInt(quantity) : parseInt(originalProduct.quantity);
        const finalSku = sku !== undefined ? sku : originalProduct.sku;
        // Choose between uploaded file image, manual url string, or original image path
        let finalImageUrl = originalProduct.image_url;
        if (req.file) {
            finalImageUrl = `/uploads/product-images/${req.file.filename}`;
        }
        else if (image_url !== undefined) {
            finalImageUrl = image_url;
        }
        const finalGalleryUrls = gallery_urls !== undefined ? gallery_urls : originalProduct.gallery_urls;
        const finalBrand = brand !== undefined ? brand : originalProduct.brand;
        const finalMrp = (mrp !== undefined && mrp !== '') ? parseFloat(mrp) : parseFloat(originalProduct.mrp);
        let finalDiscountPercent = (discount_percent !== undefined && discount_percent !== '') ? parseInt(discount_percent) : originalProduct.discount_percent;
        if ((price !== undefined && price !== '') || (mrp !== undefined && mrp !== '')) {
            if (finalMrp > finalPrice) {
                finalDiscountPercent = Math.round(((finalMrp - finalPrice) / finalMrp) * 100);
            }
            else {
                finalDiscountPercent = 0;
            }
        }
        const calculatedStockStatus = finalQuantity > 0 ? 'In Stock' : 'Out of Stock';
        const finalStockStatus = stock_status !== undefined ? stock_status : ((quantity !== undefined && quantity !== '') ? calculatedStockStatus : originalProduct.stock_status);
        const finalRating = (rating !== undefined && rating !== '') ? parseFloat(rating) : parseFloat(originalProduct.rating);
        const finalReviewsCount = (reviews_count !== undefined && reviews_count !== '') ? parseInt(reviews_count) : parseInt(originalProduct.reviews_count);
        const finalTags = tags !== undefined ? tags : originalProduct.tags;
        const finalSpecifications = specifications !== undefined ? specifications : originalProduct.specifications;
        const finalFeatured = featured !== undefined ? ((featured === true || featured === 1 || featured === 'true' || featured === '1') ? 1 : 0) : originalProduct.featured;
        const finalStatus = status !== undefined ? status : originalProduct.status;
        // Detect modifications for cybersecurity audit logging
        const changes = {};
        if (finalPrice !== parseFloat(originalProduct.price)) {
            changes.price = { old: parseFloat(originalProduct.price), new: finalPrice };
        }
        if (finalQuantity !== parseInt(originalProduct.quantity)) {
            changes.quantity = { old: parseInt(originalProduct.quantity), new: finalQuantity };
        }
        if (finalStockStatus !== originalProduct.stock_status) {
            changes.stock_status = { old: originalProduct.stock_status, new: finalStockStatus };
        }
        if (finalStatus !== originalProduct.status) {
            changes.status = { old: originalProduct.status, new: finalStatus };
        }
        await (0, db_1.dbQuery)(`UPDATE products SET 
        name = ?, description = ?, category = ?, price = ?, quantity = ?, sku = ?, 
        image_url = ?, gallery_urls = ?, brand = ?, mrp = ?, discount_percent = ?, 
        stock_status = ?, rating = ?, reviews_count = ?, tags = ?, specifications = ?, 
        featured = ?, status = ? 
      WHERE id = ?`, [
            finalName, finalDescription, finalCategory, finalPrice, finalQuantity, finalSku,
            finalImageUrl, finalGalleryUrls, finalBrand, finalMrp, finalDiscountPercent,
            finalStockStatus, finalRating, finalReviewsCount, finalTags, finalSpecifications,
            finalFeatured, finalStatus, id
        ]);
        // Audit logs for stock/price or other alterations
        if (changes.price) {
            (0, logger_1.logSecurityEvent)('price_changed', `Price changed for product (ID: ${id}): ${finalName} from ₹${changes.price.old} to ₹${changes.price.new}`, {
                actor,
                ipAddress,
                userAgent,
                details: { productId: id, oldPrice: changes.price.old, newPrice: finalPrice }
            });
        }
        if (changes.quantity || changes.stock_status) {
            const oldQty = changes.quantity ? changes.quantity.old : originalProduct.quantity;
            const newQty = finalQuantity;
            (0, logger_1.logSecurityEvent)('stock_changed', `Stock changed for product (ID: ${id}): ${finalName} from ${oldQty} units to ${newQty} units`, {
                actor,
                ipAddress,
                userAgent,
                details: { productId: id, oldQuantity: oldQty, newQuantity: newQty, oldStockStatus: originalProduct.stock_status, newStockStatus: finalStockStatus }
            });
        }
        (0, logger_1.logSecurityEvent)('product_update', `Product updated (ID: ${id}): ${finalName}`, {
            actor,
            ipAddress,
            userAgent,
            details: {
                productId: id,
                name: finalName,
                changedFields: Object.keys(changes)
            }
        });
        res.json({
            message: 'Product updated successfully',
            product: {
                id,
                name: finalName,
                description: finalDescription,
                category: finalCategory,
                price: finalPrice,
                quantity: finalQuantity,
                sku: finalSku,
                image_url: finalImageUrl,
                gallery_urls: finalGalleryUrls,
                brand: finalBrand,
                mrp: finalMrp,
                discount_percent: finalDiscountPercent,
                stock_status: finalStockStatus,
                rating: finalRating,
                reviews_count: finalReviewsCount,
                tags: finalTags,
                specifications: finalSpecifications,
                featured: finalFeatured,
                status: finalStatus
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
// Admin action: Delete a product
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const actor = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
        const products = await (0, db_1.dbQuery)('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const product = products[0];
        await (0, db_1.dbQuery)('DELETE FROM products WHERE id = ?', [id]);
        (0, logger_1.logSecurityEvent)('product_deletion', `Product deleted (ID: ${id}): ${product.name} (SKU: ${product.sku})`, {
            actor,
            ipAddress,
            userAgent,
            details: { productId: id, name: product.name, sku: product.sku }
        });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;
