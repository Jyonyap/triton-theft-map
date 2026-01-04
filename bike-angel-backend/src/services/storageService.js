import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import storageConfig from '../config/storage.js';

class StorageService {
  constructor() {
    this.service = storageConfig.service;
    
    if (this.service === 's3') {
      this.initializeS3();
    } else if (this.service === 'cloudinary') {
      this.initializeCloudinary();
    }
  }

  initializeS3() {
    this.s3Client = new S3Client({
      region: storageConfig.s3.region,
      credentials: {
        accessKeyId: storageConfig.s3.accessKeyId,
        secretAccessKey: storageConfig.s3.secretAccessKey,
      },
    });
    this.bucket = storageConfig.s3.bucket;
  }

  initializeCloudinary() {
    cloudinary.config({
      cloud_name: storageConfig.cloudinary.cloudName,
      api_key: storageConfig.cloudinary.apiKey,
      api_secret: storageConfig.cloudinary.apiSecret,
    });
    this.cloudinaryFolder = storageConfig.cloudinary.folder;
  }

  /**
   * Process image: strip EXIF, compress, and generate thumbnail
   * @param {Buffer} buffer - Image buffer
   * @returns {Object} - Processed image and thumbnail buffers
   */
  async processImage(buffer) {
    try {
      // Strip EXIF metadata and compress main image
      const processedImage = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF (then strip)
        .jpeg({ quality: 85, mozjpeg: true })
        .withMetadata({}) // Remove all metadata
        .toBuffer();

      // Generate thumbnail (200x200)
      const thumbnail = await sharp(buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .withMetadata({}) // Remove all metadata
        .toBuffer();

      return {
        image: processedImage,
        thumbnail: thumbnail,
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Upload file to configured storage service
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Original filename
   * @param {string} mimetype - File MIME type
   * @returns {Object} - URLs for main image and thumbnail
   */
  async uploadFile(buffer, filename, mimetype) {
    // Validate file type
    if (!storageConfig.allowedMimeTypes.includes(mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${storageConfig.allowedMimeTypes.join(', ')}`);
    }

    // Validate file size
    if (buffer.length > storageConfig.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${storageConfig.maxFileSize / 1024 / 1024}MB`);
    }

    // Process image
    const { image, thumbnail } = await this.processImage(buffer);

    // Generate unique filenames
    const uniqueId = randomUUID();
    const extension = mimetype.split('/')[1];
    const imageKey = `photos/${uniqueId}.${extension}`;
    const thumbnailKey = `thumbnails/${uniqueId}.${extension}`;

    if (this.service === 's3') {
      return await this.uploadToS3(image, thumbnail, imageKey, thumbnailKey, mimetype);
    } else if (this.service === 'cloudinary') {
      return await this.uploadToCloudinary(image, thumbnail, uniqueId);
    } else {
      throw new Error(`Unsupported storage service: ${this.service}`);
    }
  }

  /**
   * Upload to AWS S3
   */
  async uploadToS3(image, thumbnail, imageKey, thumbnailKey, mimetype) {
    try {
      // Upload main image
      const imageUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: imageKey,
          Body: image,
          ContentType: mimetype,
        },
      });

      await imageUpload.done();

      // Upload thumbnail
      const thumbnailUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: mimetype,
        },
      });

      await thumbnailUpload.done();

      // Generate public URLs
      const imageUrl = `https://${this.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${imageKey}`;
      const thumbnailUrl = `https://${this.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${thumbnailKey}`;

      return {
        imageUrl,
        thumbnailUrl,
        storageKey: imageKey,
        thumbnailKey,
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload to Cloudinary
   */
  async uploadToCloudinary(image, thumbnail, uniqueId) {
    try {
      // Upload main image
      const imageUpload = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: this.cloudinaryFolder,
            public_id: uniqueId,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(image);
      });

      // Upload thumbnail
      const thumbnailUpload = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${this.cloudinaryFolder}/thumbnails`,
            public_id: uniqueId,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(thumbnail);
      });

      return {
        imageUrl: imageUpload.secure_url,
        thumbnailUrl: thumbnailUpload.secure_url,
        storageKey: imageUpload.public_id,
        thumbnailKey: thumbnailUpload.public_id,
      };
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from storage
   * @param {string} storageKey - Storage key/public_id
   * @param {string} thumbnailKey - Thumbnail storage key
   */
  async deleteFile(storageKey, thumbnailKey) {
    if (this.service === 's3') {
      return await this.deleteFromS3(storageKey, thumbnailKey);
    } else if (this.service === 'cloudinary') {
      return await this.deleteFromCloudinary(storageKey, thumbnailKey);
    }
  }

  async deleteFromS3(storageKey, thumbnailKey) {
    try {
      // Delete main image
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        })
      );

      // Delete thumbnail
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: thumbnailKey,
        })
      );

      return { success: true };
    } catch (error) {
      throw new Error(`S3 deletion failed: ${error.message}`);
    }
  }

  async deleteFromCloudinary(storageKey, thumbnailKey) {
    try {
      // Delete main image
      await cloudinary.uploader.destroy(storageKey);

      // Delete thumbnail
      await cloudinary.uploader.destroy(thumbnailKey);

      return { success: true };
    } catch (error) {
      throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
  }

  /**
   * Test storage connection and permissions
   */
  async testConnection() {
    try {
      // Create a small test image
      const testBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      // Upload test file
      const result = await this.uploadFile(testBuffer, 'test.jpg', 'image/jpeg');

      // Delete test file
      await this.deleteFile(result.storageKey, result.thumbnailKey);

      return {
        success: true,
        service: this.service,
        message: 'Storage connection successful',
      };
    } catch (error) {
      return {
        success: false,
        service: this.service,
        message: error.message,
      };
    }
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;
