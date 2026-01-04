import pool from '../config/database.js';

/**
 * Rate limiting middleware to prevent spam and abuse
 * Implements a 15-minute cooldown for specific actions per user
 */

const RATE_LIMIT_MINUTES = 15;

/**
 * Check if user has exceeded rate limit for a specific action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (parking_report, theft_report, notification)
 * @returns {Promise<{allowed: boolean, timeRemaining: number}>}
 */
export async function checkRateLimit(userId, actionType) {
  try {
    const result = await pool.query(
      `SELECT created_at 
       FROM rate_limits 
       WHERE user_id = $1 AND action_type = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, actionType]
    );

    if (result.rows.length === 0) {
      // No previous action, allow
      return { allowed: true, timeRemaining: 0 };
    }

    const lastAction = new Date(result.rows[0].created_at);
    const now = new Date();
    const minutesSinceLastAction = (now - lastAction) / (1000 * 60);

    if (minutesSinceLastAction < RATE_LIMIT_MINUTES) {
      // Rate limit exceeded
      const timeRemaining = Math.ceil(RATE_LIMIT_MINUTES - minutesSinceLastAction);
      return { allowed: false, timeRemaining };
    }

    // Enough time has passed, allow
    return { allowed: true, timeRemaining: 0 };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the action (fail open)
    return { allowed: true, timeRemaining: 0 };
  }
}

/**
 * Record a rate-limited action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 */
export async function recordRateLimitedAction(userId, actionType) {
  try {
    await pool.query(
      `INSERT INTO rate_limits (user_id, action_type, created_at)
       VALUES ($1, $2, NOW())`,
      [userId, actionType]
    );
  } catch (error) {
    console.error('Error recording rate limited action:', error);
  }
}

/**
 * Middleware factory for rate limiting specific actions
 * @param {string} actionType - Type of action to rate limit
 * @returns {Function} Express middleware
 */
export function rateLimitMiddleware(actionType) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        // If no user ID, skip rate limiting (shouldn't happen with auth middleware)
        return next();
      }

      const { allowed, timeRemaining } = await checkRateLimit(userId, actionType);

      if (!allowed) {
        return res.status(429).json({
          error: 'RateLimitExceeded',
          message: `You can only submit a ${actionType.replace('_', ' ')} once every ${RATE_LIMIT_MINUTES} minutes`,
          timeRemaining,
          statusCode: 429,
        });
      }

      // Store action type in request for later recording
      req.rateLimitAction = actionType;
      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // On error, allow the request (fail open)
      next();
    }
  };
}

/**
 * Middleware to record successful rate-limited action
 * Should be called after successful action completion
 */
export async function recordRateLimitSuccess(req, res, next) {
  try {
    if (req.rateLimitAction && req.user?.id) {
      await recordRateLimitedAction(req.user.id, req.rateLimitAction);
    }
  } catch (error) {
    console.error('Error recording rate limit success:', error);
  }
  next();
}

/**
 * Get user's rate limit status for all actions
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Rate limit status for each action type
 */
export async function getUserRateLimitStatus(userId) {
  try {
    const actionTypes = ['parking_report', 'theft_report', 'notification'];
    const status = {};

    for (const actionType of actionTypes) {
      const { allowed, timeRemaining } = await checkRateLimit(userId, actionType);
      status[actionType] = {
        allowed,
        timeRemaining,
        nextAvailable: allowed ? 'now' : `${timeRemaining} minutes`,
      };
    }

    return status;
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {};
  }
}

/**
 * Clean up old rate limit records (older than 24 hours)
 * Should be run periodically
 */
export async function cleanupOldRateLimits() {
  try {
    const result = await pool.query(
      `DELETE FROM rate_limits 
       WHERE created_at < NOW() - INTERVAL '24 hours'
       RETURNING id`
    );

    console.log(`Cleaned up ${result.rowCount} old rate limit records`);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    return 0;
  }
}
