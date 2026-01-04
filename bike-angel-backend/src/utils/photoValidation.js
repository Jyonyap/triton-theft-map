/**
 * Photo validation utilities for parking timeline
 */

/**
 * Detect if current time is night mode (6pm - 6am)
 * @returns {boolean} True if night mode
 */
export const detectNightMode = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Night mode: 6pm (18:00) to 6am (06:00)
  return hour >= 18 || hour < 6;
};

/**
 * Validate photo brightness (basic check using file size as proxy)
 * In night mode, very small files often indicate too-dark photos
 * 
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<{isValid: boolean, reason?: string}>}
 */
export const validatePhotoBrightness = async (fileBuffer, fileSize) => {
  // If not night mode, skip validation
  if (!detectNightMode()) {
    return { isValid: true };
  }
  
  // In night mode, check if file is suspiciously small (likely too dark)
  // A completely black image compresses to very small size
  const MIN_SIZE_KB = 20; // 20KB minimum for night photos
  const fileSizeKB = fileSize / 1024;
  
  if (fileSizeKB < MIN_SIZE_KB) {
    return {
      isValid: false,
      reason: 'Photo appears too dark. Please enable flash or take photo in better lighting.'
    };
  }
  
  return { isValid: true };
};

/**
 * Get night mode status and message for frontend
 * @returns {{isNightMode: boolean, message?: string}}
 */
export const getNightModeStatus = () => {
  const isNightMode = detectNightMode();
  
  return {
    isNightMode,
    message: isNightMode 
      ? 'Night mode detected. Please enable flash for better photos.' 
      : null
  };
};
