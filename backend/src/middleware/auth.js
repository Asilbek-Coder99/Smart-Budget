const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { ApiError } = require('./errorHandler');

// ============================================
// Verify JWT Token Middleware
// ============================================
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database to ensure still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        currency: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found. Token invalid.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account has been deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired token.');
  }
};

// ============================================
// Authorization by Role Middleware
// ============================================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    next();
  };
};

// ============================================
// Optional Auth (doesn't fail if no token)
// ============================================
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Silent fail for optional auth
  }

  next();
};

module.exports = { authenticate, authorize, optionalAuth };
