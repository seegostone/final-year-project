import jwt from 'jsonwebtoken';
import { userOperations } from '../utils/database.js';

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const normalizeEmailVerified = (user) =>
  user?.emailVerified ?? user?.isEmailVerified ?? false;

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');

    req.user = await userOperations.findById(req.app.locals.db, decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token',
      });
    }

    req.user.normalizedRole = normalizeRole(req.user.role);
    req.user.emailVerified = normalizeEmailVerified(req.user);
    req.user.isEmailVerified = req.user.emailVerified;

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    // Require email verification before accessing protected routes
    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource',
      });
    }

    next();
  } catch (err) {
    //let JWT errors go to global error handler
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      throw err;
    }
    // For other errors, return generic message
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user owns resource or is admin
export const ownerOrAdmin = (req, res, next) => {
  if (req.user.normalizedRole === 'admin' || req.user._id.toString() === req.params.id) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource',
    });
  }
};
