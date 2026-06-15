import { Router } from 'express';
import { checkout, getOrderHistory, getAllOrders, updateOrderStatus, cancelOrder } from '../controllers/order.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/checkout', authenticateJWT, checkout);
router.get('/history', authenticateJWT, getOrderHistory);
router.get('/admin/all', authenticateJWT, requireAdmin, getAllOrders);
router.put('/admin/status/:orderGroupId', authenticateJWT, requireAdmin, updateOrderStatus);
router.post('/cancel/:orderGroupId', authenticateJWT, cancelOrder);

export default router;
