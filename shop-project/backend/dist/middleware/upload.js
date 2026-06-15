"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Target upload path: uploads/product-images relative to processes current working directory
const uploadDir = path_1.default.join(process.cwd(), 'uploads/product-images');
// Auto-create directories if missing
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer disk storage config
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique name structure: product-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});
// File validator filter
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
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
exports.uploadProductImage = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('image'); // Expect single file named 'image'
