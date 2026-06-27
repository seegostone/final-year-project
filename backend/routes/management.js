import express from 'express';
import { body, param } from 'express-validator';
import {
  validateComplaint,
  triageComplaint,
  defineScopeComplaint,
  createTask,
  assignTask,
  unassignTask,
  getManagementQueue,
  getDashboardStats,
  performQualityCheck,
  scheduleInspection,
  requestResidentApproval,
  recordResidentApproval,
  requestRework,
  escalateComplaint,
  closeComplaint,
  getAnalytics,
  getTechnicians,
  updateTaskStatus
} from '../controllers/management.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const validateComplaintValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('validationNotes')
    .optional()
    .isString()
    .withMessage('Invalid validation notes'),
  body('isLegitimate')
    .optional()
    .isBoolean()
    .withMessage('Invalid legitimate value'),
];
// Validation rules
const updateTaskStatusValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  param('taskId').isMongoId().withMessage('Invalid task ID'),
  body('status')
    .notEmpty()
    .isIn(['open', 'in_progress', 'done', 'blocked'])
    .withMessage('Status must be one of: open, in_progress, done, blocked'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
];


const triageComplaintValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    .withMessage('Invalid priority level'),
  body('triageNotes')
    .optional()
    .isString()
    .withMessage('Invalid triage notes'),
];

const defineScopeValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('scopeDescription')
    .notEmpty()
    .withMessage('Scope description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Scope description must be between 10 and 500 characters'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be a positive number'),
  body('requiredSkills')
    .optional()
    .custom((value) => {
      return Array.isArray(value) || typeof value === 'string';
    })
    .withMessage('Required skills must be an array or comma-separated string'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),
  body('dependencies')
    .optional()
    .custom((value) => {
      return Array.isArray(value) || typeof value === 'string';
    })
    .withMessage('Dependencies must be an array or comma-separated string'),
];


const qualityCheckValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('qualityStatus')
    .notEmpty()
    .withMessage('Quality status is required')
    .isIn(['PASSED', 'FAILED', 'NEEDS_REVIEW'])
    .withMessage('Invalid quality status'),
  body('checkNotes')
    .notEmpty()
    .withMessage('Check notes are required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Check notes must be between 5 and 500 characters'),
  body('photos')
    .optional()
    .isArray()
    .withMessage('Photos must be an array'),
];

const scheduleInspectionValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('scheduledFor')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('inspectionNotes')
    .optional()
    .isString()
    .withMessage('Invalid inspection notes'),
];

const requestApprovalValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('message')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Message must be a string with max 500 characters'),
];

const residentApprovalValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('approvalStatus')
    .notEmpty()
    .withMessage('Approval status is required')
    .isIn(['ACCEPTED', 'REJECTED', 'PARTIAL'])
    .withMessage('Invalid approval status'),
  body('satisfactionRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Satisfaction rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isString()
    .withMessage('Invalid feedback'),
  body('rejectionReason')
    .if(body('approvalStatus').equals('REJECTED'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting'),
];

const reworkValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('reworkReason')
    .notEmpty()
    .withMessage('Rework reason is required')
    .isIn(['INCOMPLETE', 'QUALITY_ISSUE', 'RESIDENT_REQUEST', 'OTHER'])
    .withMessage('Invalid rework reason'),
  body('reworkDetails')
    .notEmpty()
    .withMessage('Rework details are required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rework details must be between 5 and 500 characters'),
];

const escalateValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('escalationReason')
    .notEmpty()
    .withMessage('Escalation reason is required')
    .isIn(['CRITICAL', 'BUDGET_EXCEEDED', 'REWORK_FAILED', 'SAFETY_ISSUE', 'OTHER'])
    .withMessage('Invalid escalation reason'),
  body('escalationDetails')
    .notEmpty()
    .withMessage('Escalation details are required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Escalation details must be between 5 and 500 characters'),
  body('escalateTo')
    .optional()
    .isString()
    .withMessage('Invalid escalate to value'),
];

const closeValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('closureSummary')
    .notEmpty()
    .withMessage('Closure summary is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Closure summary must be between 10 and 500 characters'),
  body('preventiveRecommendations')
    .optional()
    .isArray()
    .withMessage('Preventive recommendations must be an array'),
  body('costActual')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual cost must be a positive number'),
];
const createTaskValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('title').notEmpty().withMessage('Task title is required').isString(),
  body('description').optional().isString(),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or CRITICAL'),
  body('estimatedDurationDays')
    .notEmpty()
    .withMessage('Estimated duration (in days) is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be a whole number of days (minimum 1)'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('notes').optional().isString(),
  body('assigneeId').optional().isMongoId().withMessage('Invalid assignee ID'),
  body('assigneeName').optional().isString(),
];


const assignTaskValidation = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  param('taskId').isMongoId().withMessage('Invalid task ID'),
  body('technicianId')
    .notEmpty()
    .isMongoId()
    .withMessage('Technician ID is required and must be valid'),
  body('technicianName')
    .notEmpty()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Technician name must be between 2 and 100 characters'),
];

// All routes require authentication
router.use(protect);

// Request resident approval - Officer initiates (before admin-only middleware)
router.post(
  '/:id/request-approval',
  authorize('admin', 'estates_officer'),
  requestApprovalValidation,
  requestResidentApproval
);

// Resident Approval can be done by resident, admin, or estates officer
router.put(
  '/:id/resident-approval',
  residentApprovalValidation,
  recordResidentApproval
);

// Admin/Estates Officer only routes
router.use(authorize('admin', 'estates_officer'));

// Validation & Triage endpoints
router.post('/:id/validate', validateComplaintValidation, validateComplaint);

router.post('/:id/triage', triageComplaintValidation, triageComplaint);

router.post('/:id/scope', defineScopeValidation, defineScopeComplaint);

// Task endpoints
router.post('/:id/tasks', createTaskValidation, createTask);
router.post('/:id/tasks/:taskId/assign', assignTaskValidation, assignTask);
router.post('/:id/tasks/:taskId/unassign', unassignTask);
router.patch('/:id/tasks/:taskId/status', updateTaskStatusValidation, updateTaskStatus);
// Queue & Dashboard
router.get('/queue', getManagementQueue);

router.get('/dashboard', getDashboardStats);

// Quality Check & Inspection
router.post(
  '/:id/quality-check',
  qualityCheckValidation,
  performQualityCheck
);

router.post(
  '/:id/schedule-inspection',
  scheduleInspectionValidation,
  scheduleInspection
);

// Rework & Escalation
router.post('/:id/rework', reworkValidation, requestRework);

router.post('/:id/escalate', escalateValidation, escalateComplaint);

// Closure
router.put('/:id/close', closeValidation, closeComplaint);

// Analytics
router.get('/analytics', getAnalytics);

// Technicians list
router.get('/technicians', getTechnicians);

export default router;
