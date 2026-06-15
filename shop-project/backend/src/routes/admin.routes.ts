import { Router } from 'express';
import { getUsers, addUser, deleteUser, getDashboardStats } from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Secure all routes with authentication and Admin role checks
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/users', getUsers);
router.post('/users', addUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getDashboardStats);

export default router;
