import storageService from '../services/storageService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testStorage() {
  console.log('Testing cloud storage configuration...\n');

  try {
    // Test connection
    console.log('1. Testing storage connection...');
    const connectionTest = await storageService.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Storage connection successful!');
      console.log(`   Service: ${connectionTest.service}`);
      console.log(`   Message: ${connectionTest.message}\n`);
    } else {
      console.log('❌ Storage connection failed!');
      console.log(`   Service: ${connectionTest.service}`);
      console.log(`   Error: ${connectionTest.message}\n`);
      process.exit(1);
    }

    // Test with a real image if available
    console.log('2. Testing file upload with sample image...');
    
    // Create a test image buffer
    const sharp = (await import('sharp')).default;
    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    console.log(`   Created test image: ${testImageBuffer.length} bytes`);

    // Upload test image
    const uploadResult = await storageService.uploadFile(
      testImageBuffer,
      'test-upload.jpg',
      'image/jpeg'
    );

    console.log('✅ File upload successful!');
    console.log(`   Image URL: ${uploadResult.imageUrl}`);
    console.log(`   Thumbnail URL: ${uploadResult.thumbnailUrl}`);
    console.log(`   Storage Key: ${uploadResult.storageKey}\n`);

    // Test file deletion
    console.log('3. Testing file deletion...');
    await storageService.deleteFile(uploadResult.storageKey, uploadResult.thumbnailKey);
    console.log('✅ File deletion successful!\n');

    console.log('🎉 All storage tests passed!');
    console.log('\nStorage service is properly configured and ready to use.');
    
  } catch (error) {
    console.error('❌ Storage test failed:');
    console.error(`   Error: ${error.message}`);
    console.error('\nPlease check your configuration in .env file:');
    console.error('   - STORAGE_SERVICE (s3 or cloudinary)');
    console.error('   - AWS credentials (if using S3)');
    console.error('   - Cloudinary credentials (if using Cloudinary)');
    process.exit(1);
  }
}

// Run tests
testStorage();
