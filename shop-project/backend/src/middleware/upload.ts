import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Target upload path: uploads/product-images relative to processes current working directory
const uploadDir = path.join(process.cwd(), 'uploads/product-images');

// Auto-create directories if missing
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name structure: product-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// File validator filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate extension
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension. Only JPG, JPEG, PNG and WEBP formats are supported.'));
  }

  // Validate MIME-type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid MIME-type. Only image files (JPG, JPEG, PNG, WEBP) are allowed.'));
  }

  cb(null, true);
};

// Export the customized upload middleware
export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('image'); // Expect single file named 'image'
