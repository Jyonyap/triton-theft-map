// Admin authorization middleware
// Ensures only users with 'admin' role can access protected routes

/**
 * Middleware to require admin role for route access
 * Must be used after authMiddleware to ensure req.user is populated
 * 
 * @param {Object} req - Express request object (expects req.user from authMiddleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requireAdmin = (req, res, next) => {
  // Check if user is authenticated (should be set by authMiddleware)
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required. This action is restricted to administrators only.'
    });
  }

  // User is authenticated and has admin role
  next();
};

export default requireAdmin;
