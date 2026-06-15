"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Graceful wrapper to handle multer upload errors
const handleUpload = (req, res, next) => {
    (0, upload_1.uploadProductImage)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};
router.get('/', product_controller_1.getProducts);
router.get('/:id', product_controller_1.getProductById);
router.post('/', auth_1.authenticateJWT, auth_1.requireAdmin, handleUpload, product_controller_1.createProduct);
router.put('/:id', auth_1.authenticateJWT, auth_1.requireAdmin, handleUpload, product_controller_1.updateProduct);
router.delete('/:id', auth_1.authenticateJWT, auth_1.requireAdmin, product_controller_1.deleteProduct);
exports.default = router;
