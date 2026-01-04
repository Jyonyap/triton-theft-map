import express from 'express';
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware.js';
import storageService from '../services/storageService.js';

const router = express.Router();

/**
 * Example route for testing photo upload
 * POST /api/upload/test
 * 
 * This is a simple example route to test the storage service.
 * In production, this would be part of the parking report endpoint.
 */
router.post('/test', uploadSingle, handleUploadError, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a photo',
        statusCode: 400,
      });
    }

    // Upload to cloud storage
    const result = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        storageKey: result.storageKey,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
      statusCode: 500,
    });
  }
});

/**
 * Example route for testing photo deletion
 * DELETE /api/upload/test/:storageKey/:thumbnailKey
 */
router.delete('/test/:storageKey/:thumbnailKey', async (req, res) => {
  try {
    const { storageKey, thumbnailKey } = req.params;

    // Decode URL-encoded keys
    const decodedStorageKey = decodeURIComponent(storageKey);
    const decodedThumbnailKey = decodeURIComponent(thumbnailKey);

    await storageService.deleteFile(decodedStorageKey, decodedThumbnailKey);

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Deletion error:', error);
    res.status(500).json({
      error: 'Deletion failed',
      message: error.message,
      statusCode: 500,
    });
  }
});

export default router;
