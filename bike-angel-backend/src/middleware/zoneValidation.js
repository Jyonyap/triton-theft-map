/**
 * Zone Validation Middleware
 * Validation rules for zone-related endpoints
 */

import { body } from 'express-validator';

/**
 * Validation rules for zone suggestion endpoint
 */
export const validateZoneSuggestion = [
  body('suggestedName')
    .trim()
    .notEmpty()
    .withMessage('Zone name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Zone name must be between 3 and 255 characters'),
  
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90'),
  
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180'),
  
  body('estimatedCapacity')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Capacity must be an integer between 1 and 500'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
];
