# Cloud Storage Setup Guide

This guide explains how to configure cloud storage for the Bike Angel backend. The application supports both **AWS S3** and **Cloudinary** for storing user-uploaded photos.

## Table of Contents
- [Choosing a Storage Service](#choosing-a-storage-service)
- [AWS S3 Setup](#aws-s3-setup)
- [Cloudinary Setup](#cloudinary-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [CORS Configuration](#cors-configuration)

## Choosing a Storage Service

### AWS S3
**Pros:**
- Industry standard, highly reliable
- Pay-as-you-go pricing (very cheap for small apps)
- Full control over bucket policies
- Good for production deployments

**Cons:**
- Requires AWS account setup
- More complex configuration
- Need to manage IAM permissions

### Cloudinary
**Pros:**
- Easier setup, developer-friendly
- Free tier: 25GB storage, 25GB bandwidth/month
- Built-in image transformations
- Great for prototyping

**Cons:**
- Less control over storage
- Can be more expensive at scale

## AWS S3 Setup

### Step 1: Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Sign up for a free account (requires credit card)

### Step 2: Create S3 Bucket
1. Go to AWS Console → S3
2. Click "Create bucket"
3. **Bucket name**: `bike-angel-photos` (must be globally unique)
4. **Region**: Choose closest to your users (e.g., `us-west-2`)
5. **Block Public Access**: Uncheck "Block all public access"
   - ⚠️ We need public read access for photos
   - Check the acknowledgment box
6. Click "Create bucket"

### Step 3: Configure Bucket Policy
1. Go to your bucket → Permissions → Bucket Policy
2. Add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### Step 4: Configure CORS
1. Go to your bucket → Permissions → CORS
2. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Step 5: Create IAM User
1. Go to AWS Console → IAM → Users
2. Click "Add users"
3. **User name**: `bike-angel-uploader`
4. **Access type**: Programmatic access
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: `AmazonS3FullAccess` (or create custom policy)
8. Click through to "Create user"
9. **IMPORTANT**: Save the Access Key ID and Secret Access Key

### Step 6: Update .env File
```env
STORAGE_SERVICE=s3
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-west-2
AWS_S3_BUCKET=bike-angel-photos
```

## Cloudinary Setup

### Step 1: Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Verify your email

### Step 2: Get API Credentials
1. Go to Dashboard
2. Find your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 3: Update .env File
```env
STORAGE_SERVICE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=bike-angel
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your chosen storage service credentials.

### File Upload Limits

Default configuration in `src/config/storage.js`:
- **Max file size**: 5MB
- **Allowed types**: JPEG, JPG, PNG, WebP
- **Image processing**: 
  - EXIF metadata stripped (privacy)
  - Compressed to 85% quality
  - Thumbnail generated (200x200px)

## Testing

### Test Storage Connection

Run the storage test script:

```bash
npm run storage:test
```

This will:
1. ✅ Test connection to your storage service
2. ✅ Upload a test image
3. ✅ Generate thumbnail
4. ✅ Delete test files
5. ✅ Verify all operations work

### Expected Output

```
Testing cloud storage configuration...

1. Testing storage connection...
✅ Storage connection successful!
   Service: s3
   Message: Storage connection successful

2. Testing file upload with sample image...
   Created test image: 12345 bytes
✅ File upload successful!
   Image URL: https://bike-angel-photos.s3.us-west-2.amazonaws.com/photos/...
   Thumbnail URL: https://bike-angel-photos.s3.us-west-2.amazonaws.com/thumbnails/...
   Storage Key: photos/...

3. Testing file deletion...
✅ File deletion successful!

🎉 All storage tests passed!

Storage service is properly configured and ready to use.
```

## CORS Configuration

### For AWS S3

CORS is configured in the bucket settings (see Step 4 above).

### For Cloudinary

Cloudinary handles CORS automatically. No additional configuration needed.

### For Backend API

The backend needs CORS configured to accept requests from the frontend:

In `src/server.js`:
```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## Usage in Code

### Upload a File

```javascript
import storageService from './services/storageService.js';

// In your route handler
const result = await storageService.uploadFile(
  req.file.buffer,
  req.file.originalname,
  req.file.mimetype
);

// Returns:
// {
//   imageUrl: 'https://...',
//   thumbnailUrl: 'https://...',
//   storageKey: 'photos/uuid.jpg',
//   thumbnailKey: 'thumbnails/uuid.jpg'
// }
```

### Delete a File

```javascript
await storageService.deleteFile(storageKey, thumbnailKey);
```

## Troubleshooting

### AWS S3 Issues

**Error: "Access Denied"**
- Check IAM user has S3 permissions
- Verify bucket policy allows public read
- Ensure credentials are correct in .env

**Error: "Bucket not found"**
- Verify bucket name is correct
- Check region matches your bucket's region

**Error: "CORS policy error"**
- Add CORS configuration to bucket
- Ensure AllowedOrigins includes your frontend URL

### Cloudinary Issues

**Error: "Invalid credentials"**
- Double-check Cloud Name, API Key, and API Secret
- Ensure no extra spaces in .env file

**Error: "Upload failed"**
- Check free tier limits (25GB storage)
- Verify API key is active

### General Issues

**Error: "File too large"**
- Default limit is 5MB
- Adjust MAX_FILE_SIZE in .env

**Error: "Invalid file type"**
- Only JPEG, PNG, WebP allowed
- Check file MIME type

## Security Best Practices

1. **Never commit .env file** - Add to .gitignore
2. **Use environment variables** - Never hardcode credentials
3. **Rotate keys regularly** - Change AWS/Cloudinary keys periodically
4. **Limit permissions** - Use least-privilege IAM policies
5. **Monitor usage** - Set up billing alerts in AWS
6. **Strip EXIF data** - Already handled by storageService
7. **Validate file types** - Already handled by storageService

## Cost Estimates

### AWS S3 (us-west-2)
- Storage: $0.023 per GB/month
- Requests: $0.005 per 1,000 PUT requests
- Data transfer: First 100GB free/month
- **Example**: 1000 photos (1GB) = ~$0.03/month

### Cloudinary Free Tier
- 25GB storage
- 25GB bandwidth/month
- 25,000 transformations/month
- **Good for**: ~5,000-10,000 photos

## Next Steps

After configuring storage:
1. ✅ Run `npm run storage:test` to verify setup
2. ✅ Implement photo upload routes (Task 4.1)
3. ✅ Add multer middleware for file handling
4. ✅ Test with frontend camera component

## Support

For issues:
- AWS S3: [AWS Documentation](https://docs.aws.amazon.com/s3/)
- Cloudinary: [Cloudinary Docs](https://cloudinary.com/documentation)
- Project issues: Check backend logs and error messages
