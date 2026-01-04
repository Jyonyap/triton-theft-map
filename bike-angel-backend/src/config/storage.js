import dotenv from 'dotenv';

dotenv.config();

const storageConfig = {
  service: process.env.STORAGE_SERVICE || 's3', // 's3' or 'cloudinary'
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // AWS S3 Configuration
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-west-2',
    bucket: process.env.AWS_S3_BUCKET || 'bike-angel-photos',
  },
  
  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'bike-angel',
  }
};

export default storageConfig;
