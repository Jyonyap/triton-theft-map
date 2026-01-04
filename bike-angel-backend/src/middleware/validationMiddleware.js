import { validationResult } from 'express-validator';

/**
 * Validation middleware
 * Checks for validation errors and returns them if present
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      statusCode: 400,
      errors: errors.array()
    });
  }
  
  next();
};
