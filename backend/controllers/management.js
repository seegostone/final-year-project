import { validationResult } from 'express-validator';
import { managementOperations, userOperations } from '../utils/database.js';
import emailService from '../services/emailService.js';
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

    console.log('🔵 [DEFINE SCOPE] Started with complaint:', complaintId);

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
      });
    }

    // Validate MongoDB ObjectId
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
        message: 'Complaint not found',
      });
    }

    console.log('✅ [DEFINE SCOPE] Completed successfully');

    res.status(200).json({
      success: true,
      message: 'Scope defined successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('❌ [DEFINE SCOPE] ERROR:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};






// ── updateTaskStatus controller ──────────────────────────────
// @desc    Update task status (open / in_progress / done / blocked)
// @route   PATCH /api/management/:id/tasks/:taskId/status
// @access  Private (Admin, Estates Officer)

export const updateTaskStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const { id: complaintId, taskId } = req.params;
    const { status, notes } = req.body;

    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    if (!ObjectId.isValid(complaintId) || !ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint or task ID' });
    }

    const updated = await managementOperations.updateTaskStatus(
      db, complaintId, taskId, { status, notes }, userId
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task or complaint not found' });
    }

    res.status(200).json({ success: true, message: 'Task status updated', data: updated });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating task status' });
  }
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
    const {
      title,
      description,
      notes,
      priority,
      estimatedDurationDays,
      startDate,
      assigneeId,
      assigneeName,
    } = req.body;

    console.log('🔵 [CREATE TASK] for complaint', complaintId, 'by', userId.toString());

    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to create tasks' });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const task = await managementOperations.addTaskToComplaint(
      db,
      complaintId,
      {
        title,
        description,
        notes,
        priority,
        estimatedDurationDays,
        startDate,
        assigneeId,
        assigneeName,
      },
      userId
    );

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

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    // Prevent assigning if task already has an assignee
    const complaintDoc = await db.collection('complaints').findOne({ _id: new ObjectId(complaintId) });
    const targetTask = (complaintDoc?.tasks || []).find((t) => {
      const taskIdValue = t._id?.toString?.() ?? String(t._id);
      return taskIdValue === String(taskId);
    });
    if (!targetTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (targetTask.assigneeId) {
      return res.status(400).json({ success: false, message: 'Task already has an assignee' });
    }

    const isEligible = await userOperations.isTechnicianEligible(
      db,
      technicianId,
      complaintDoc?.category || null
    );

    console.log('DEBUG assign: category=', complaintDoc?.category, 'technicianId=', technicianId, 'eligible=', isEligible);

    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: 'Selected technician is not eligible for this complaint category or has too many active tasks',
      });
    }

    const updated = await managementOperations.assignTaskToComplaint(db, complaintId, taskId, { technicianId, technicianName }, userId);

    if (updated) {
      try {
        const technician = await userOperations.findById(db, technicianId);
        if (technician) {
          await userOperations.addNotification(db, technician._id, {
            type: 'task_assigned',
            title: 'New task assigned',
            message: `A new task "${updated.tasks.find((t) => t._id.toString() === taskId)?.title || 'Task'}" has been assigned to you.`,
            complaintId: updated._id.toString(),
            taskId,
            route: `/technician/tasks/${taskId}`,
          });

          if (technician.email) {
            await emailService.sendNotificationEmail(
              technician.email,
              'A task has been assigned to you',
              `You have been assigned a new task for complaint ${updated.complaintId}.`,
              { route: `/technician/tasks/${taskId}` }
            );
          }
        }
      } catch (notifyError) {
        console.warn('Task assignment notification failed:', notifyError.message);
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task or complaint not found or cannot be assigned' });
    }

    res.status(200).json({ success: true, message: 'Task assigned', data: updated });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ success: false, message: 'Server error while assigning task' });
  }
};

// @desc    Unassign a technician from a specific task
// @route   POST /api/management/:id/tasks/:taskId/unassign
// @access  Private (Admin, Estates Officer)
export const unassignTask = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;
    const taskId = req.params.taskId;

    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to unassign tasks' });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const updated = await managementOperations.unassignTaskFromComplaint(db, complaintId, taskId, userId);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task or complaint not found or cannot be unassigned' });
    }

    res.status(200).json({ success: true, message: 'Task unassigned', data: updated });
  } catch (error) {
    console.error('Unassign task error:', error);
    res.status(500).json({ success: false, message: 'Server error while unassigning task' });
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
    const categoryFilter = req.query.category || 'all';
    const searchQuery = req.query.search || '';

    console.log(
      '🔵 [GET QUEUE] Priority:', priorityFilter,
      'Status:', statusFilter,
      'Category:', categoryFilter,
      'Search:', searchQuery,
      'Page:', page,
      'Limit:', limit
    );

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
      statusFilter,
      categoryFilter,
      searchQuery
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

// @desc    Request resident approval (Officer initiates)
// @route   POST /api/management/:id/request-approval
// @access  Private (Admin, Estates Officer)
export const requestResidentApproval = async (req, res) => {
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
    const { message } = req.body;

    console.log('🔵 [REQUEST APPROVAL]', complaintId, 'by', userId.toString());

    // Check permission - only officers/admins can request
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to request resident approval',
      });
    }

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaintDoc = await db.collection('complaints').findOne({
      _id: new ObjectId(complaintId),
    });

    if (!complaintDoc) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    const complaint = await managementOperations.requestResidentApproval(
      db,
      complaintId,
      {
        message,
        requestedBy: userId,
        requestedByName: req.user.name || 'Estates Officer',
      }
    );

    if (!complaint) {
      return res.status(400).json({
        success: false,
        message:
          'Complaint is not ready for resident approval. It must be resolved, or scope_defined with all tasks completed.',
      });
    }

    // Send notification/email to resident
    try {
      const submitter = await userOperations.findById(db, complaint.userId);
      if (submitter) {
        await userOperations.addNotification(db, submitter._id, {
          type: 'approval_request',
          title: 'Approval requested for your complaint',
          message: `Approval was requested for complaint ${complaint.complaintId || complaint._id.toString()}. Please review the completed work and provide feedback.`,
          complaintId: complaint._id.toString(),
          route: `/complaints/${complaint._id.toString()}`,
        });

        if (submitter.email) {
          await emailService.sendNotificationEmail(
            submitter.email,
            'Your work approval is requested',
            `Please review the completed work for complaint ${complaint.complaintId || complaint._id.toString()} and provide your feedback. ${message || ''}`,
            { route: `/complaints/${complaint._id.toString()}` }
          );
        }
      }
    } catch (notifyError) {
      console.warn('Request approval notification failed:', notifyError);
    }

    console.log('✅ [REQUEST APPROVAL] Sent:', complaintId);

    res.status(200).json({
      success: true,
      message: 'Resident approval request sent successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Request resident approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while requesting resident approval',
    });
  }
};

// @desc    Record resident approval/rejection (Resident responds)
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
    const userRole = req.user.normalizedRole || req.user.role;
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

    const complaintDoc = await db.collection('complaints').findOne({
      _id: new ObjectId(complaintId),
    });

    if (!complaintDoc) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    const allowedAdminRoles = ['admin', 'estates_officer'];
    if (
      !allowedAdminRoles.includes(userRole) &&
      complaintDoc.userId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to submit approval for this complaint',
      });
    }

    if (complaintDoc.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Resident approval can only be submitted for resolved complaints',
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
        approvedByName: req.user.name || 'Resident',
      }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot record approval',
      });
    }

    try {
      const officerMessage =
        approvalStatus === 'ACCEPTED'
          ? `Resident accepted the resolution for complaint ${complaint.complaintId || complaint._id.toString()}.`
          : approvalStatus === 'REJECTED'
            ? `Resident rejected the resolution for complaint ${complaint.complaintId || complaint._id.toString()}.`
            : `Resident partially accepted the resolution for complaint ${complaint.complaintId || complaint._id.toString()}.`;

      const officers = await db.collection('users')
        .find({ normalizedRole: { $in: ['estates_officer', 'admin'] }, isActive: true })
        .toArray();

      await Promise.allSettled(
        officers.map(async (officer) => {
          await db.collection('users').updateOne(
            { _id: officer._id },
            {
              $push: {
                notifications: {
                  $each: [
                    {
                      _id: new ObjectId(),
                      type:
                        approvalStatus === 'ACCEPTED'
                          ? 'resident_feedback_accepted'
                          : approvalStatus === 'REJECTED'
                            ? 'resident_feedback_rejected'
                            : 'resident_feedback_partial',
                      title: 'Resident feedback received',
                      message: officerMessage,
                      complaintId: complaint._id.toString(),
                      route: '/management/queue',
                      isRead: false,
                      createdAt: new Date(),
                    },
                  ],
                  $position: 0,
                },
              },
              $set: { updatedAt: new Date() },
            }
          );

          if (officer.email) {
            await emailService.sendNotificationEmail(
              officer.email,
              'Resident approval response received',
              officerMessage,
              { route: '/management/queue' }
            );
          }
        })
      );

      const submitter = await userOperations.findById(db, complaint.userId);
      if (submitter?.email) {
        await emailService.sendNotificationEmail(
          submitter.email,
          'Your approval response has been recorded',
          `Your feedback for complaint ${complaint.complaintId || complaint._id.toString()} has been recorded successfully. Thank you for your response.`,
          { route: `/complaints/${complaint._id.toString()}` }
        );
      }
    } catch (notifyError) {
      console.warn('Resident approval notification failed:', notifyError);
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

    if (complaint) {
      try {
        const targetUser = await userOperations.findById(db, escalateTo || userId);
        if (targetUser) {
          await userOperations.addNotification(db, targetUser._id, {
            type: 'complaint_escalated',
            title: 'Complaint escalated',
            message: `Complaint ${complaint.complaintId} has been escalated for review.`,
            complaintId: complaint._id.toString(),
            route: `/complaints/${complaint._id.toString()}`,
          });

          if (targetUser.email) {
            await emailService.sendNotificationEmail(
              targetUser.email,
              'Complaint escalated',
              `Complaint ${complaint.complaintId} has been escalated. Please review it at your earliest convenience.`,
              { route: `/complaints/${complaint._id.toString()}` }
            );
          }
        }
      } catch (escalationError) {
        console.warn('Escalation notification failed:', escalationError.message);
      }
    }

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

    if (complaint) {
      try {
        const submitter = await userOperations.findById(db, complaint.userId);
        if (submitter) {
          await userOperations.addNotification(db, submitter._id, {
            type: 'complaint_closed',
            title: 'Complaint closed',
            message: `Complaint ${complaint.complaintId} has been closed.`,
            complaintId: complaint._id.toString(),
            route: `/complaints/${complaint._id.toString()}`,
          });

          if (submitter.email) {
            await emailService.sendNotificationEmail(
              submitter.email,
              'Complaint closed',
              `Your complaint ${complaint.complaintId} has been closed. Thank you for your patience.`,
              { route: `/complaints/${complaint._id.toString()}` }
            );
          }
        }
      } catch (closeError) {
        console.warn('Complaint closure notification failed:', closeError.message);
      }
    }

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
    const category = req.query.category || null;
    const maxActiveTasks = 2;

    console.log('🔵 [GET TECHNICIANS]', 'Category:', category);

    const query = {
      role: 'technician',
      isActive: true,
    };

    const technicians = await usersCollection
      .find(query)
      .project({
        _id: 1,
        name: 1,
        email: 1,
        phoneNumber: 1,
        phone: 1,
        role: 1,
        specialization: 1,
        trade: 1,
        zone: 1,
        skills: 1,
        avatar: 1,
      })
      .toArray();

    const eligibleTechnicians = [];

    for (const technician of technicians) {
      const isEligible = await userOperations.isTechnicianEligible(
        db,
        technician._id,
        category,
        maxActiveTasks
      );

      if (isEligible) {
        eligibleTechnicians.push({
          ...technician,
          specialization: technician.specialization || technician.trade || '',
          trade: technician.trade || technician.specialization || '',
          skills: technician.skills || [],
        });
      }
    }

    console.log('✅ [GET TECHNICIANS] Eligible:', eligibleTechnicians.length);

    res.status(200).json({
      success: true,
      count: eligibleTechnicians.length,
      data: eligibleTechnicians,
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching technicians',
    });
  }
};
