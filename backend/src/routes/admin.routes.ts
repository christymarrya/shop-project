import { Router } from 'express';
import { getUsers, addUser, deleteUser, getDashboardStats, updateUserRole, getSecurityEvents } from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Secure all routes with authentication and Admin role checks
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/users', getUsers);
router.post('/users', addUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/stats', getDashboardStats);
router.get('/security-events', getSecurityEvents);

export default router;
