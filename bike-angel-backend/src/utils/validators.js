/**
 * Validate UCSD email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email ends with @ucsd.edu
 */
export const isUCSDEmail = (email) => {
  return email && email.toLowerCase().endsWith('@ucsd.edu');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password meets requirements
 */
export const isStrongPassword = (password) => {
  // Min 8 characters, 1 uppercase, 1 number
  const minLength = password && password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return minLength && hasUppercase && hasNumber;
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input.trim().replace(/[<>]/g, '');
};
