/**
 * Image optimization utilities for better performance
 */
import imageCompression from 'browser-image-compression';

/**
 * Compress image before upload using browser-image-compression library
 * This provides much better compression than canvas-based methods
 * @param {File} file - Image file to compress
 * @param {number} maxSizeMB - Maximum file size in MB (default: 0.5MB = 500KB)
 * @param {number} maxWidthOrHeight - Maximum width or height in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, maxSizeMB = 0.5, maxWidthOrHeight = 1920, quality = 0.75) {
  try {
    const options = {
      maxSizeMB: maxSizeMB, // Target: 500KB or less
      maxWidthOrHeight: maxWidthOrHeight, // Max dimension
      useWebWorker: true, // Use web worker for better performance
      quality: quality, // JPEG quality
      initialQuality: 0.8, // Starting quality for iterative compression
      alwaysKeepResolution: false, // Allow resolution reduction if needed
      fileType: 'image/jpeg', // Always convert to JPEG for best compression
    };
    
    console.log('Compressing image...', {
      originalSize: formatBytes(file.size),
      originalName: file.name,
      targetSize: `${maxSizeMB}MB`,
    });
    
    const compressedFile = await imageCompression(file, options);
    
    console.log('Compression complete:', {
      originalSize: formatBytes(file.size),
      compressedSize: formatBytes(compressedFile.size),
      reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
    });
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback to canvas-based compression if library fails
    return fallbackCompressImage(file, maxWidthOrHeight, quality);
  }
}

/**
 * Fallback canvas-based compression (original method)
 * Used if browser-image-compression fails
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
async function fallbackCompressImage(file, maxWidth = 1920, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Create thumbnail from image
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<Blob>} Thumbnail blob
 */
export async function createThumbnail(file, size = 200) {
  return compressImage(file, size, size, 0.7);
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images to lazy load
 */
export function setupLazyLoading(selector = 'img[data-src]') {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll(selector).forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll(selector).forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

/**
 * Preload critical images
 * @param {string[]} urls - Array of image URLs to preload
 */
export function preloadImages(urls) {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Get optimal image format based on browser support
 * @returns {string} Preferred image format
 */
export function getOptimalImageFormat() {
  // Check for WebP support
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg';
  }
  return 'jpeg';
}

/**
 * Calculate file size reduction
 * @param {number} originalSize - Original file size in bytes
 * @param {number} compressedSize - Compressed file size in bytes
 * @returns {object} Size reduction stats
 */
export function calculateSizeReduction(originalSize, compressedSize) {
  const reduction = originalSize - compressedSize;
  const percentage = ((reduction / originalSize) * 100).toFixed(2);
  
  return {
    originalSize: formatBytes(originalSize),
    compressedSize: formatBytes(compressedSize),
    reduction: formatBytes(reduction),
    percentage: `${percentage}%`,
  };
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
