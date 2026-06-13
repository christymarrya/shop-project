"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Secure all routes with authentication and Admin role checks
router.use(auth_1.authenticateJWT);
router.use(auth_1.requireAdmin);
router.get('/users', admin_controller_1.getUsers);
router.post('/users', admin_controller_1.addUser);
router.put('/users/:id/role', admin_controller_1.updateUserRole);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.get('/stats', admin_controller_1.getDashboardStats);
router.get('/security-events', admin_controller_1.getSecurityEvents);
exports.default = router;
