import multer from 'multer';
import storageConfig from '../config/storage.js';

// Configure multer to use memory storage (we'll process and upload to cloud)
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  if (storageConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${storageConfig.allowedMimeTypes.join(', ')}`
      ),
      false
    );
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: storageConfig.maxFileSize,
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
export const uploadSingle = upload.single('photo');

// Error handling middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `Maximum file size is ${storageConfig.maxFileSize / 1024 / 1024}MB`,
        statusCode: 413,
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
      statusCode: 400,
    });
  }

  if (err) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
      statusCode: 400,
    });
  }

  next();
};

export default upload;
