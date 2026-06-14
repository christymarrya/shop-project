import { Router } from 'express';
import { vulnerableLogin, secureLogin } from '../controllers/securityLab.controller';

const router = Router();

router.post('/sql-injection/login-vulnerable', vulnerableLogin);
router.post('/sql-injection/login-secure', secureLogin);

export default router;
