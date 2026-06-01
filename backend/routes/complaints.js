import express from 'express';
import { body, param } from 'express-validator';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  getAllComplaints,
  getComplaintStats,
  deleteComplaint,
} from '../controllers/complaints.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// Validation rules
const createComplaintValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('location').notEmpty().withMessage('Location is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('urgency')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid urgency level'),
  body('imageData').optional().isString().withMessage('Invalid image data'),
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'assigned', 'in-progress', 'resolved'])
    .withMessage('Invalid status value'),
  body('assignedTo')
    .if(body('status').equals('assigned'))
    .notEmpty()
    .withMessage('assignedTo is required when status is assigned')
    .isString()
    .withMessage('Invalid assigned to value'),
  body('resolutionNotes')
    .if(body('status').equals('resolved'))
    .notEmpty()
    .withMessage('resolutionNotes is required when status is resolved')
    .isString()
    .withMessage('Invalid resolution notes'),
  body('note').optional().isString().withMessage('Invalid note value'),
];

// All routes require authentication
router.use(protect);

// Stats route (before :id routes)
router.get('/stats', getComplaintStats);

// My complaints route (before :id routes)
router.get('/my-complaints', getMyComplaints);

// Admin/Estates only - get all complaints
router.get('/all', authorize('admin', 'estates_officer'), getAllComplaints);

// Create complaint with file upload
router.post(
  '/',
  upload.single('image'),
  createComplaintValidation,
  createComplaint
);

// Routes with :id
router.get('/:id', getComplaintById);
router.put(
  '/:id/status',
  authorize('admin', 'estates_officer', 'warden'),
  updateStatusValidation,
  updateComplaintStatus
);
router.delete('/:id', deleteComplaint);

export default router;
