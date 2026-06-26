import multer from 'multer';
import path from 'path';
import fs from 'fs';

const __dirname = process.cwd();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'complaints');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 20MB.',
        error: err.message,
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many file parts',
        error: err.message,
      });
    }
  }
  
  if (err instanceof Error && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'Only JPEG, PNG, GIF, and WebP images are allowed',
    });
  }
  
  next(err);
};
