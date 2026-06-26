import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from '../controllers/auth.js';

const router = express.Router();

// Validation rules
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom((email) => {
      const normalizedEmail = email.toLowerCase();
      if (!normalizedEmail.endsWith(gmailDomain)) {
        throw new Error('Email must be a valid @gmail.com address');
      }
      if (isPlaceholderEmail(normalizedEmail)) {
        throw new Error('Please use a real personal email address, not a placeholder.');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),

  body('role')
    .optional()
    .isIn(['Custodian', 'Resident Staff', 'Warden', 'Technician', 'Admin'])
    .withMessage('Invalid role selected'),

  body('specialization')
    .custom((value, { req }) => {
      if (req.body.role === 'Technician' && (!value || value.trim() === '')) {
        throw new Error('Specialization is required for technicians');
      }
      return true;
    }),

  body('zone')
    .custom((value, { req }) => {
      if (req.body.role === 'Technician' && (!value || value.trim() === '')) {
        throw new Error('Zone is required for technicians');
      }
      return true;
    }),

  body('skills')
    .optional()
    .isString()
    .withMessage('Skills must be a comma-separated string'),

  body('phoneNumber')
    .optional()
    .matches(/^07\d{8}$/)
    .withMessage('Phone number must start with 07 and be 10 digits long'),
];

const gmailDomain = '@gmail.com';

const isPlaceholderEmail = (email) => {
  const localPart = String(email).split('@')[0].toLowerCase();
  const invalidPatterns = [
    /^resident[_\d].*/,
    /^user[_\d].*/,
    /^test[_\d].*/,
    /^dummy[_\d].*/,
    /^example[_\d].*/,
    /^admin[_\d]?.*/,
    /^(no[-_.]?reply|noreply|support|contact)$/,
    /^guest[_\d]?.*/,
  ];

  return invalidPatterns.some((pattern) => pattern.test(localPart));
};

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom((email) => {
      if (!email.toLowerCase().endsWith(gmailDomain)) {
        throw new Error('Email must be a valid @gmail.com address');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

//note: forgot password and reset password routes are public because they are accessed before authentication
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  forgotPassword
);
router.put(
  '/reset-password/:resettoken',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  resetPassword
);
router.get('/verify-email/:verificationtoken', verifyEmail);
router.post(
  '/resend-verification',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  resendVerificationEmail
);

// Protected routes
router.get('/me', protect, getMe);
router.put(
  '/update-password',
  protect,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  updatePassword
);
router.post('/logout', protect, logout);

export default router;
