import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { uploadProductImage } from '../middleware/upload';

const router = Router();

// Graceful wrapper to handle multer upload errors
const handleUpload = (req: any, res: any, next: any) => {
  uploadProductImage(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticateJWT, requireAdmin, handleUpload, createProduct);
router.put('/:id', authenticateJWT, requireAdmin, handleUpload, updateProduct);
router.delete('/:id', authenticateJWT, requireAdmin, deleteProduct);

export default router;
