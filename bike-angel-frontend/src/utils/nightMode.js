/**
 * Night mode detection utility for frontend
 */

/**
 * Detect if current time is night mode (6pm - 6am)
 * @returns {boolean} True if night mode
 */
export const isNightMode = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Night mode: 6pm (18:00) to 6am (06:00)
  return hour >= 18 || hour < 6;
};

/**
 * Get night mode status with message
 * @returns {{isNightMode: boolean, message: string}}
 */
export const getNightModeStatus = () => {
  const nightMode = isNightMode();
  
  return {
    isNightMode: nightMode,
    message: nightMode 
      ? '🌙 Night mode detected. Please enable flash for better photos.' 
      : null
  };
};
