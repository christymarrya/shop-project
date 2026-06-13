import { Router } from 'express';
import { getCart, addToCart, updateCartItem, deleteCartItem, clearCart } from '../controllers/cart.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all cart endpoints
router.use(authenticateJWT);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', deleteCartItem);
router.delete('/', clearCart);

export default router;
