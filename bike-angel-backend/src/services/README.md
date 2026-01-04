# Services Documentation

## Storage Service

The `storageService` handles all photo uploads, processing, and deletion for the Bike Angel platform.

### Features

- ✅ **Multi-provider support**: AWS S3 or Cloudinary
- ✅ **Privacy protection**: Strips EXIF metadata from photos
- ✅ **Image optimization**: Compresses images to reduce storage costs
- ✅ **Thumbnail generation**: Creates 200x200px thumbnails automatically
- ✅ **File validation**: Checks file type and size
- ✅ **Error handling**: Comprehensive error messages

### Configuration

Set up your storage provider in `.env`:

```env
# Choose 's3' or 'cloudinary'
STORAGE_SERVICE=s3

# AWS S3 (if using S3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-west-2
AWS_S3_BUCKET=bike-angel-photos

# Cloudinary (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Usage

#### Import the service

```javascript
import storageService from '../services/storageService.js';
```

#### Upload a file

```javascript
// In your route handler with multer middleware
const result = await storageService.uploadFile(
  req.file.buffer,      // File buffer from multer
  req.file.originalname, // Original filename
  req.file.mimetype     // MIME type (e.g., 'image/jpeg')
);

// Returns:
// {
//   imageUrl: 'https://bucket.s3.region.amazonaws.com/photos/uuid.jpg',
//   thumbnailUrl: 'https://bucket.s3.region.amazonaws.com/thumbnails/uuid.jpg',
//   storageKey: 'photos/uuid.jpg',
//   thumbnailKey: 'thumbnails/uuid.jpg'
// }
```

#### Delete a file

```javascript
await storageService.deleteFile(
  storageKey,    // From upload result
  thumbnailKey   // From upload result
);
```

#### Test connection

```javascript
const result = await storageService.testConnection();

if (result.success) {
  console.log('Storage is working!');
} else {
  console.error('Storage error:', result.message);
}
```

### Image Processing

All uploaded images are automatically processed:

1. **EXIF Stripping**: Removes all metadata (location, camera info, etc.)
2. **Compression**: Reduces file size to ~85% quality
3. **Thumbnail**: Generates 200x200px thumbnail
4. **Format**: Converts to JPEG for consistency

### File Validation

- **Max size**: 5MB (configurable via `MAX_FILE_SIZE` env var)
- **Allowed types**: JPEG, JPG, PNG, WebP
- **Validation**: Happens before upload to save bandwidth

### Error Handling

The service throws descriptive errors:

```javascript
try {
  const result = await storageService.uploadFile(buffer, filename, mimetype);
} catch (error) {
  // Possible errors:
  // - "Invalid file type. Allowed types: ..."
  // - "File too large. Maximum size: 5MB"
  // - "Image processing failed: ..."
  // - "S3 upload failed: ..." or "Cloudinary upload failed: ..."
  console.error(error.message);
}
```

### Example Route

See `src/routes/uploadExample.js` for a complete example:

```javascript
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware.js';
import storageService from '../services/storageService.js';

router.post('/upload', uploadSingle, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Testing

Run the storage test suite:

```bash
npm run storage:test
```

This will:
1. Test connection to your storage provider
2. Upload a test image
3. Verify thumbnail generation
4. Delete test files
5. Confirm everything works

### Security Notes

- ⚠️ Never commit `.env` file with credentials
- ✅ EXIF data is automatically stripped for privacy
- ✅ File types are validated before upload
- ✅ File size is limited to prevent abuse
- ✅ Public read access is required for S3 buckets
- ✅ Use IAM roles with minimal permissions

### Troubleshooting

**"Access Denied" (S3)**
- Check IAM permissions
- Verify bucket policy allows public read
- Ensure credentials are correct

**"Invalid credentials" (Cloudinary)**
- Double-check Cloud Name, API Key, API Secret
- Remove any extra spaces from .env

**"File too large"**
- Default limit is 5MB
- Adjust `MAX_FILE_SIZE` in .env

**"Invalid file type"**
- Only JPEG, PNG, WebP allowed
- Check the file's actual MIME type

### Performance

- **Image processing**: ~100-500ms per image
- **S3 upload**: ~200-1000ms depending on file size and region
- **Cloudinary upload**: ~300-1500ms depending on file size
- **Thumbnail generation**: Included in processing time

### Cost Optimization

- Images are compressed to reduce storage costs
- Thumbnails are generated once and cached
- Old reports (>12 hours) should be cleaned up regularly
- Consider lifecycle policies for S3 to archive old photos

### Future Enhancements

- [ ] Face detection and automatic blurring
- [ ] WebP format support for better compression
- [ ] Progressive image loading
- [ ] CDN integration for faster delivery
- [ ] Batch upload support
- [ ] Image resizing on-demand
