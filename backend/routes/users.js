import express from 'express';
import { body, param } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserProfile,
} from '../controllers/users.js';
import { protect, authorize, ownerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  param('id').isMongoId().withMessage('Invalid user ID'),
];

// All routes require authentication
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  deleteUser
);

// User profile routes (owner or admin)
router.get('/profile', getUserProfile);
router.get(
  '/:id',
  ownerOrAdmin,
  [param('id').isMongoId().withMessage('Invalid user ID')],
  getUser
);
router.put('/:id', ownerOrAdmin, updateUserValidation, updateUser);

export default router;
