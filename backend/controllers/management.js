import { validationResult } from 'express-validator';
import { managementOperations } from '../utils/database.js';
import { ObjectId } from 'mongodb';

// @desc    Validate incoming complaint (initial analysis)
// @route   POST /api/management/validate
// @access  Private (Admin, Estates Officer)
export const validateComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const { validationNotes, isLegitimate } = req.body;
    const complaintId = req.params.id;

    console.log('🔵 [VALIDATE COMPLAINT]', complaintId, 'by', userId.toString());

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to validate complaints',
      });
    }

    // Validate MongoDB ObjectId (from URL parameter)
    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.validateComplaint(
      db,
      complaintId,
      {
        validationNotes,
        isLegitimate,
        validatedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be validated',
      });
    }

    console.log('✅ [VALIDATE COMPLAINT] Validated:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Complaint validated successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Validate complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating complaint',
    });
  }
};

// @desc    Triage and prioritize complaint
// @route   POST /api/management/triage
// @access  Private (Admin, Estates Officer)
export const triageComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const { priority, triageNotes } = req.body;

    console.log('🔵 [TRIAGE COMPLAINT]', complaintId, 'Priority:', priority);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to triage complaints',
      });
    }

    // Validate MongoDB ObjectId (from URL parameter)
    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.triageComplaint(
      db,
      complaintId,
      {
        priority,
        triageNotes,
        triageBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be triaged',
      });
    }

    console.log('✅ [TRIAGE COMPLAINT] Triaged:', complaintId, 'as', priority);

    res.status(200).json({
      success: true,
      message: 'Complaint triaged successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Triage complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while triaging complaint',
    });
  }
};

// @desc    Define task scope for complaint
// @route   POST /api/management/scope
// @access  Private (Admin, Estates Officer)
export const defineScopeComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const {
      scopeDescription,
      estimatedDuration,
      requiredSkills,
      estimatedCost,
      dependencies,
    } = req.body;

    console.log('🔵 [DEFINE SCOPE]', complaintId);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to define complaint scope',
      });
    }

    // Validate MongoDB ObjectId (from URL parameter)
    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.defineScopeComplaint(
      db,
      complaintId,
      {
        scopeDescription,
        estimatedDuration,
        requiredSkills,
        estimatedCost,
        dependencies,
        definedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be scoped',
      });
    }

    console.log('✅ [DEFINE SCOPE] Scoped:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Complaint scope defined successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Define scope error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while defining complaint scope',
    });
  }
};

// @desc    Assign complaint to technician
// @route   POST /api/management/:id/assign
// @access  Private (Admin, Estates Officer)
export const assignComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const { technicianId, technicianName } = req.body;

    console.log('🔵 [ASSIGN COMPLAINT]', complaintId, 'to', technicianName);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to assign complaints',
      });
    }

    // Validate MongoDB ObjectId (from URL parameter)
    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.assignComplaint(
      db,
      complaintId,
      {
        technicianId,
        technicianName,
        assignedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be assigned',
      });
    }

    console.log('✅ [ASSIGN COMPLAINT] Assigned:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully',
      data: complaint,
    });
  };

  // @desc    Create a task for a complaint
  // @route   POST /api/management/:id/tasks
  // @access  Private (Admin, Estates Officer)
  export const createTask = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const userId = req.user._id;
      const userRole = req.user.normalizedRole || req.user.role;
      const complaintId = req.params.id;
      const { title, description, notes } = req.body;

      console.log('🔵 [CREATE TASK] for complaint', complaintId, 'by', userId.toString());

      const allowedRoles = ['admin', 'estates_officer'];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to create tasks' });
      }

      if (!ObjectId.isValid(complaintId)) {
        return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
      }

      const task = await managementOperations.addTaskToComplaint(db, complaintId, { title, description, notes }, userId);

      if (!task) {
        return res.status(404).json({ success: false, message: 'Complaint not found or task could not be created' });
      }

      res.status(201).json({ success: true, message: 'Task created', data: task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ success: false, message: 'Server error while creating task' });
    }
  };

  // @desc    Assign a technician to a specific task
  // @route   POST /api/management/:id/tasks/:taskId/assign
  // @access  Private (Admin, Estates Officer)
  export const assignTask = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const userId = req.user._id;
      const userRole = req.user.normalizedRole || req.user.role;
      const complaintId = req.params.id;
      const taskId = req.params.taskId;
      const { technicianId, technicianName } = req.body;

      console.log('🔵 [ASSIGN TASK]', taskId, 'for complaint', complaintId, 'to', technicianName);

      const allowedRoles = ['admin', 'estates_officer'];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to assign tasks' });
      }

      if (!ObjectId.isValid(complaintId) || !ObjectId.isValid(taskId)) {
        return res.status(400).json({ success: false, message: 'Invalid complaint or task ID' });
      }

      const updated = await managementOperations.assignTaskToComplaint(db, complaintId, taskId, { technicianId, technicianName }, userId);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Task or complaint not found or cannot be assigned' });
      }

      res.status(200).json({ success: true, message: 'Task assigned', data: updated });
    } catch (error) {
      console.error('Assign task error:', error);
      res.status(500).json({ success: false, message: 'Server error while assigning task' });
    }
  }; catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning complaint',
    });
  }
};

// @desc    Get complaint management queue
// @route   GET /api/management/queue
// @access  Private (Admin, Estates Officer)
export const getManagementQueue = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userRole = req.user.normalizedRole || req.user.role;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const priorityFilter = req.query.priority || 'all';
    const statusFilter = req.query.status || 'all';

    console.log('🔵 [GET QUEUE] Priority:', priorityFilter, 'Status:', statusFilter);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view management queue',
      });
    }

    const result = await managementOperations.getManagementQueue(
      db,
      page,
      limit,
      priorityFilter,
      statusFilter
    );

    console.log('✅ [GET QUEUE] Found', result.complaints.length, 'complaints');

    res.status(200).json({
      success: true,
      count: result.complaints.length,
      pagination: result.pagination,
      data: result.complaints,
    });
  } catch (error) {
    console.error('Get management queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching management queue',
    });
  }
};

// @desc    Get management dashboard stats
// @route   GET /api/management/dashboard
// @access  Private (Admin, Estates Officer)
export const getDashboardStats = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userRole = req.user.normalizedRole || req.user.role;
    const timeRange = req.query.timeRange || 'all';

    console.log('🔵 [GET DASHBOARD] TimeRange:', timeRange);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view dashboard',
      });
    }

    const stats = await managementOperations.getDashboardStats(db, timeRange);

    console.log('✅ [GET DASHBOARD] Stats retrieved');

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats',
    });
  }
};

// @desc    Perform internal quality check
// @route   POST /api/management/:id/quality-check
// @access  Private (Admin, Estates Officer)
export const performQualityCheck = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const { qualityStatus, checkNotes, photos } = req.body;

    console.log('🔵 [QUALITY CHECK]', complaintId, 'Status:', qualityStatus);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform quality checks',
      });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.performQualityCheck(
      db,
      complaintId,
      {
        qualityStatus,
        checkNotes,
        photos,
        checkedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be quality checked',
      });
    }

    console.log('✅ [QUALITY CHECK] Completed:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Quality check completed successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Quality check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing quality check',
    });
  }
};

// @desc    Schedule resident inspection
// @route   POST /api/management/:id/schedule-inspection
// @access  Private (Admin, Estates Officer)
export const scheduleInspection = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const { scheduledFor, inspectionNotes } = req.body;

    console.log('🔵 [SCHEDULE INSPECTION]', complaintId);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to schedule inspections',
      });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.scheduleInspection(
      db,
      complaintId,
      {
        scheduledFor,
        inspectionNotes,
        scheduledBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot schedule inspection',
      });
    }

    console.log('✅ [SCHEDULE INSPECTION] Scheduled:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Inspection scheduled successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Schedule inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while scheduling inspection',
    });
  }
};

// @desc    Record resident approval/rejection
// @route   PUT /api/management/:id/resident-approval
// @access  Private (Resident, Admin, Estates Officer)
export const recordResidentApproval = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const complaintId = req.params.id;
    const {
      approvalStatus,
      satisfactionRating,
      feedback,
      rejectionReason,
    } = req.body;

    console.log('🔵 [RESIDENT APPROVAL]', complaintId, 'Status:', approvalStatus);

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.recordResidentApproval(
      db,
      complaintId,
      {
        approvalStatus,
        satisfactionRating,
        feedback,
        rejectionReason,
        approvedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot record approval',
      });
    }

    console.log('✅ [RESIDENT APPROVAL] Recorded:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Resident approval recorded successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Record resident approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording resident approval',
    });
  }
};

// @desc    Request rework from technician
// @route   POST /api/management/:id/rework
// @access  Private (Admin, Estates Officer)
export const requestRework = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const { reworkReason, reworkDetails } = req.body;

    console.log('🔵 [REQUEST REWORK]', complaintId);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to request rework',
      });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.requestRework(
      db,
      complaintId,
      {
        reworkReason,
        reworkDetails,
        requestedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or max rework cycles exceeded',
      });
    }

    console.log('✅ [REQUEST REWORK] Rework requested:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Rework requested successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Request rework error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while requesting rework',
    });
  }
};

// @desc    Escalate complaint to supervisor
// @route   POST /api/management/:id/escalate
// @access  Private (Admin, Estates Officer)
export const escalateComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const { escalationReason, escalationDetails, escalateTo } = req.body;

    console.log('🔵 [ESCALATE COMPLAINT]', complaintId, 'Reason:', escalationReason);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to escalate complaints',
      });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.escalateComplaint(
      db,
      complaintId,
      {
        escalationReason,
        escalationDetails,
        escalateTo: escalateTo || userId,
        escalatedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be escalated',
      });
    }

    console.log('✅ [ESCALATE COMPLAINT] Escalated:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Complaint escalated successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Escalate complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while escalating complaint',
    });
  }
};

// @desc    Close complaint
// @route   PUT /api/management/:id/close
// @access  Private (Admin, Estates Officer)
export const closeComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const {
      closureSummary,
      preventiveRecommendations,
      costActual,
    } = req.body;

    console.log('🔵 [CLOSE COMPLAINT]', complaintId);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to close complaints',
      });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await managementOperations.closeComplaint(
      db,
      complaintId,
      {
        closureSummary,
        preventiveRecommendations,
        costActual,
        closedBy: userId,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be closed',
      });
    }

    console.log('✅ [CLOSE COMPLAINT] Closed:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Complaint closed successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Close complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while closing complaint',
    });
  }
};

// @desc    Get performance analytics
// @route   GET /api/management/analytics
// @access  Private (Admin, Estates Officer)
export const getAnalytics = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userRole = req.user.normalizedRole || req.user.role;
    const timeRange = req.query.timeRange || 'thismonth';

    console.log('🔵 [GET ANALYTICS] TimeRange:', timeRange);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics',
      });
    }

    const analytics = await managementOperations.getAnalytics(db, timeRange);

    console.log('✅ [GET ANALYTICS] Analytics retrieved');

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
    });
  }
};

// @desc    Get list of technicians
// @route   GET /api/management/technicians
// @access  Private (Admin, Estates Officer)
export const getTechnicians = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');

    console.log('🔵 [GET TECHNICIANS]');

    const technicians = await usersCollection
      .find({ role: 'technician', isActive: true })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        specialization: 1,
        avatar: 1,
      })
      .toArray();

    console.log('✅ [GET TECHNICIANS] Found:', technicians.length);

    res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching technicians',
    });
  }
};
