# Quick Start: Cloud Storage

Get cloud storage working in 5 minutes!

## Choose Your Provider

### 🚀 Cloudinary (Recommended for Quick Start)

**Fastest setup - 2 minutes:**

1. Sign up at [cloudinary.com](https://cloudinary.com) (free)
2. Copy credentials from dashboard
3. Update `.env`:
   ```env
   STORAGE_SERVICE=cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Test: `npm run storage:test`

### 🏢 AWS S3 (Recommended for Production)

**More setup - 10 minutes:**

1. Create AWS account
2. Create S3 bucket (e.g., `bike-angel-photos`)
3. Set bucket to public read
4. Add CORS configuration
5. Create IAM user with S3 access
6. Update `.env`:
   ```env
   STORAGE_SERVICE=s3
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-west-2
   AWS_S3_BUCKET=bike-angel-photos
   ```
7. Test: `npm run storage:test`

## Test It

```bash
# Run the test suite
npm run storage:test
```

**Expected output:**
```
✅ Storage connection successful!
✅ File upload successful!
✅ File deletion successful!
🎉 All storage tests passed!
```

## Use It

```javascript
import storageService from './services/storageService.js';

// Upload a photo
const result = await storageService.uploadFile(
  fileBuffer,
  'photo.jpg',
  'image/jpeg'
);

console.log(result.imageUrl);     // Full-size image
console.log(result.thumbnailUrl); // 200x200 thumbnail
```

## Done! ✅

Storage is configured. Move on to the next task.

For detailed setup instructions, see [STORAGE_SETUP.md](./STORAGE_SETUP.md)
