# Storage Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Camera     │         │  Photo Form  │                │
│  │  Component   │────────▶│   Upload     │                │
│  └──────────────┘         └──────────────┘                │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  │ POST /api/reports/parking
                                  │ (multipart/form-data)
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Upload Middleware (Multer)                 │  │
│  │  • Receives file from request                        │  │
│  │  • Validates file type (JPEG, PNG, WebP)            │  │
│  │  • Validates file size (max 5MB)                    │  │
│  │  • Stores in memory buffer                          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Storage Service (storageService.js)          │  │
│  │                                                      │  │
│  │  1. Process Image:                                  │  │
│  │     • Strip EXIF metadata (privacy)                 │  │
│  │     • Compress to 85% quality                       │  │
│  │     • Generate 200x200 thumbnail                    │  │
│  │                                                      │  │
│  │  2. Upload to Cloud:                                │  │
│  │     • Main image → photos/uuid.jpg                  │  │
│  │     • Thumbnail → thumbnails/uuid.jpg               │  │
│  │                                                      │  │
│  │  3. Return URLs:                                    │  │
│  │     • imageUrl (full size)                          │  │
│  │     • thumbnailUrl (200x200)                        │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│                       ▼                                     │
│              ┌────────────────┐                            │
│              │  Choose Cloud  │                            │
│              │   Provider     │                            │
│              └────────┬───────┘                            │
│                       │                                     │
│         ┌─────────────┴─────────────┐                     │
│         ▼                           ▼                      │
│  ┌─────────────┐            ┌─────────────┐              │
│  │   AWS S3    │            │ Cloudinary  │              │
│  │   Upload    │            │   Upload    │              │
│  └─────────────┘            └─────────────┘              │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Storage                            │
│                                                             │
│  AWS S3 Bucket                  Cloudinary                 │
│  ┌──────────────┐              ┌──────────────┐           │
│  │   photos/    │              │ bike-angel/  │           │
│  │   uuid.jpg   │              │   uuid.jpg   │           │
│  └──────────────┘              └──────────────┘           │
│  ┌──────────────┐              ┌──────────────┐           │
│  │ thumbnails/  │              │ thumbnails/  │           │
│  │   uuid.jpg   │              │   uuid.jpg   │           │
│  └──────────────┘              └──────────────┘           │
│                                                             │
│  Public URLs:                                              │
│  https://bucket.s3.region.amazonaws.com/photos/uuid.jpg   │
│  https://res.cloudinary.com/cloud/image/upload/...        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Upload Flow

```
1. User takes photo
   ↓
2. Frontend sends to backend
   ↓
3. Multer validates and buffers
   ↓
4. Storage service processes:
   • Strip EXIF
   • Compress
   • Generate thumbnail
   ↓
5. Upload to cloud (S3 or Cloudinary)
   ↓
6. Return public URLs
   ↓
7. Save URLs to database
   ↓
8. Return success to frontend
```

### Image Processing Pipeline

```
Original Photo (3MB, with EXIF)
         ↓
    [Sharp Processing]
         ↓
    ┌────┴────┐
    ▼         ▼
Main Image  Thumbnail
(~1MB)      (20KB)
No EXIF     200x200
85% quality 80% quality
    ↓         ↓
  Upload    Upload
    ↓         ↓
  URL       URL
```

## Component Responsibilities

### 1. Upload Middleware (`uploadMiddleware.js`)
**Responsibility:** Request handling and validation
- Receive multipart/form-data
- Validate file type
- Validate file size
- Buffer file in memory
- Handle upload errors

### 2. Storage Service (`storageService.js`)
**Responsibility:** Image processing and cloud upload
- Strip EXIF metadata
- Compress images
- Generate thumbnails
- Upload to S3 or Cloudinary
- Delete files
- Test connections

### 3. Storage Config (`storage.js`)
**Responsibility:** Configuration management
- Load environment variables
- Define allowed file types
- Set file size limits
- Configure S3 settings
- Configure Cloudinary settings

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
│                                                             │
│  1. Frontend Validation                                    │
│     • File type check                                      │
│     • File size check                                      │
│     • Privacy warning                                      │
│                                                             │
│  2. Backend Validation (Multer)                           │
│     • MIME type validation                                 │
│     • File size limit (5MB)                               │
│     • Memory buffer (no disk write)                       │
│                                                             │
│  3. Image Processing (Sharp)                              │
│     • EXIF stripping (removes location, camera info)      │
│     • Format normalization (JPEG)                         │
│     • Compression (reduces size)                          │
│                                                             │
│  4. Cloud Storage                                         │
│     • HTTPS/TLS encryption in transit                     │
│     • Encryption at rest (S3/Cloudinary)                  │
│     • Public read, authenticated write                    │
│     • Access control policies                             │
│                                                             │
│  5. Database                                              │
│     • Store URLs only (not files)                         │
│     • User ID association                                 │
│     • Timestamp tracking                                  │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Options

### Environment Variables

```env
# Choose provider
STORAGE_SERVICE=s3 | cloudinary

# File limits
MAX_FILE_SIZE=5242880  # 5MB in bytes

# AWS S3 (if STORAGE_SERVICE=s3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_S3_BUCKET=bike-angel-photos

# Cloudinary (if STORAGE_SERVICE=cloudinary)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=bike-angel
```

## API Endpoints

### Upload Photo
```
POST /api/reports/parking
Content-Type: multipart/form-data

Body:
  photo: [file]
  zoneId: [string]

Response:
{
  reportId: "uuid",
  imageUrl: "https://...",
  thumbnailUrl: "https://...",
  timestamp: "2024-01-01T12:00:00Z"
}
```

### Test Upload (Development)
```
POST /api/upload/test
Content-Type: multipart/form-data

Body:
  photo: [file]

Response:
{
  success: true,
  imageUrl: "https://...",
  thumbnailUrl: "https://..."
}
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Flow                               │
│                                                             │
│  Upload Request                                            │
│       ↓                                                     │
│  ┌─────────────────┐                                       │
│  │ File too large? │──Yes──▶ 413 Payload Too Large        │
│  └────────┬────────┘                                       │
│           No                                                │
│           ↓                                                 │
│  ┌─────────────────┐                                       │
│  │ Invalid type?   │──Yes──▶ 400 Bad Request              │
│  └────────┬────────┘                                       │
│           No                                                │
│           ↓                                                 │
│  ┌─────────────────┐                                       │
│  │ Processing fail?│──Yes──▶ 500 Processing Error         │
│  └────────┬────────┘                                       │
│           No                                                │
│           ↓                                                 │
│  ┌─────────────────┐                                       │
│  │ Upload fail?    │──Yes──▶ 500 Upload Error             │
│  └────────┬────────┘                                       │
│           No                                                │
│           ↓                                                 │
│      Success! 200                                          │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| EXIF Stripping | ~50ms | Sharp processing |
| Compression | ~100-300ms | Depends on image size |
| Thumbnail Gen | ~50ms | 200x200 resize |
| S3 Upload | ~200-1000ms | Depends on region/size |
| Cloudinary Upload | ~300-1500ms | Includes processing |
| **Total** | **~500-2000ms** | End-to-end upload |

## Storage Costs

### AWS S3 (us-west-2)
- Storage: $0.023/GB/month
- PUT requests: $0.005/1,000 requests
- GET requests: $0.0004/1,000 requests
- Data transfer: First 100GB free/month

**Example:** 10,000 photos (10GB) = ~$0.30/month

### Cloudinary Free Tier
- 25GB storage
- 25GB bandwidth/month
- 25,000 transformations/month

**Good for:** ~10,000-15,000 photos

## Scalability

### Current Implementation
- Handles: ~100 concurrent uploads
- Bottleneck: Image processing (CPU)
- Solution: Horizontal scaling (multiple instances)

### Future Optimizations
- [ ] Queue-based processing (Bull/Redis)
- [ ] CDN integration (CloudFront/Cloudinary CDN)
- [ ] Lazy thumbnail generation
- [ ] WebP format support
- [ ] Progressive image loading

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Coverage                            │
│                                                             │
│  Unit Tests                                                │
│  • Image processing functions                              │
│  • File validation logic                                   │
│  • URL generation                                          │
│                                                             │
│  Integration Tests                                         │
│  • Upload endpoint                                         │
│  • Delete endpoint                                         │
│  • Error handling                                          │
│                                                             │
│  End-to-End Tests                                          │
│  • Full upload flow                                        │
│  • Image retrieval                                         │
│  • Cleanup operations                                      │
│                                                             │
│  Automated Test Script                                     │
│  • npm run storage:test                                    │
│  • Connection verification                                 │
│  • Upload/delete cycle                                     │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring & Logging

### Key Metrics to Track
- Upload success rate
- Average upload time
- Storage usage
- Error rates by type
- Cost per upload

### Logging Points
```javascript
// Upload start
logger.info('Upload started', { userId, fileSize, mimetype });

// Processing
logger.info('Image processed', { originalSize, compressedSize });

// Upload complete
logger.info('Upload complete', { imageUrl, duration });

// Errors
logger.error('Upload failed', { error, userId, fileSize });
```

## Summary

The storage architecture provides:
- ✅ Multi-provider support (S3 & Cloudinary)
- ✅ Privacy protection (EXIF stripping)
- ✅ Cost optimization (compression)
- ✅ Performance optimization (thumbnails)
- ✅ Security (validation, encryption)
- ✅ Scalability (cloud-native)
- ✅ Testability (automated tests)
- ✅ Maintainability (clear separation of concerns)
