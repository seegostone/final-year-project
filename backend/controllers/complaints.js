import { validationResult } from 'express-validator';
import { complaintOperations, userOperations } from '../utils/database.js';
import emailService from '../services/emailService.js';
import { ObjectId } from 'mongodb';

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Resident Staff, Warden, Custodian)
export const createComplaint = async (req, res, next) => {
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

    console.log('🔵 [CREATE COMPLAINT] User ID:', userId.toString(), 'Role:', userRole);

    // Check if user role is allowed to submit complaints
    const allowedRoles = ['resident_staff', 'warden', 'custodian'];
    if (!allowedRoles.includes(userRole)) {
      console.warn('❌ [CREATE COMPLAINT] User role not authorized:', userRole);
      return res.status(403).json({
        success: false,
        message: 'Your role is not authorized to submit complaints',
      });
    }

    // Sanitize and whitelist complaint data
    // Handle both file upload and imageData fallback
    let imageData = null;
    if (req.file) {
      // File was uploaded, construct URL path
      imageData = `/uploads/complaints/${req.file.filename}`;
    } else if (req.body.imageData) {
      // Fallback to imageData string if no file uploaded
      imageData = req.body.imageData;
    }

    const complaintData = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      category: req.body.category,
      urgency: req.body.urgency || 'Medium',
      imageData,
      submitterName: req.user.name || 'Unknown',
    };

    // Additional validation for required fields
    const requiredFields = ['title', 'description', 'location', 'category'];
    const missingFields = requiredFields.filter(
      (field) => !complaintData[field]
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: missingFields.join(', '), msg: 'Required fields missing' },
        ],
      });
    }

    const complaint = await complaintOperations.createComplaint(
      db,
      complaintData,
      userId,
      userRole
    );

    console.log('✅ [CREATE COMPLAINT] Created successfully:', complaint._id.toString());

    try {
      await userOperations.addNotification(db, userId, {
        type: 'complaint_submitted',
        title: 'Complaint submitted',
        message: `Your complaint "${complaint.title}" has been submitted successfully.`,
        complaintId: complaint._id.toString(),
        route: `/complaints/${complaint._id.toString()}`,
      });
    } catch (notificationError) {
      console.warn('Could not add complaint notification:', notificationError.message);
    }

    try {
      if (req.user?.email) {
        await emailService.sendNotificationEmail(
          req.user.email,
          'Complaint submitted successfully',
          `Your complaint titled "${complaint.title}" has been received and is now pending review.`,
          {
            route: `/complaints/${complaint._id.toString()}`,
            role: req.user.normalizedRole || req.user.role,
          }
        );
      }
    } catch (emailError) {
      console.warn('Complaint submission email failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        id: complaint._id,
        complaintId: complaint.complaintId,
        title: complaint.title,
        description: complaint.description,
        location: complaint.location,
        category: complaint.category,
        urgency: complaint.urgency,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [CREATE COMPLAINT] Error:', error.message);
    next(error); // Pass to global error handler
  }
};

// @desc    Get current user's complaints
// @route   GET /api/complaints/my-complaints
// @access  Private
export const getMyComplaints = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status || 'all';
    const timeRange = req.query.timeRange || 'all';
    const category = req.query.category || 'all';
    const search = req.query.search || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    console.log('🔵 [GET MY COMPLAINTS] User ID:', userId.toString(), 'Filters:', { status, category, timeRange, page, limit });

    const result = await complaintOperations.getUserComplaints(
      db,
      userId,
      page,
      limit,
      status,
      timeRange,
      category,
      search,
      startDate,
      endDate
    );

    console.log('✅ [GET MY COMPLAINTS] Found', result.complaints.length, 'complaints');

    res.status(200).json({
      success: true,
      count: result.complaints.length,
      pagination: result.pagination,
      data: result.complaints,
    });
  } catch (error) {
    console.error('Get my complaints error:', error);
    next(error); // Pass to global error handler
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await complaintOperations.getComplaintById(
      db,
      complaintId,
      userId,
      userRole
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or you do not have permission to view it',
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaint',
    });
  }
};

// @desc    Update complaint status (for estates staff)
// @route   PUT /api/complaints/:id/status
// @access  Private (Estates Staff, Admin, Warden)
export const updateComplaintStatus = async (req, res) => {
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

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    // Check if user has permission to update status
    const allowedRoles = ['admin', 'estates_officer', 'warden'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update complaint status',
      });
    }

    const { status, assignedTo, resolutionNotes, note } = req.body;

    if (status === 'assigned' && !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'assignedTo',
            msg: 'assignedTo is required when status is assigned',
          },
        ],
      });
    }

    if (status === 'resolved' && !resolutionNotes) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'resolutionNotes',
            msg: 'resolutionNotes is required when status is resolved',
          },
        ],
      });
    }

    const statusData = {
      status,
      assignedTo,
      resolutionNotes,
      note,
      staffName: req.user.name || 'Unknown',
    };

    // If assigning to someone, fetch their name
    if (status === 'assigned' && assignedTo) {
      try {
        const users = db.collection('users');
        const assignedUser = await users.findOne(
          { _id: new ObjectId(assignedTo) },
          { projection: { name: 1 } }
        );
        statusData.assignedToName = assignedUser?.name || 'Unknown';
      } catch (err) {
        statusData.assignedToName = 'Unknown';
      }
    }

    const complaint = await complaintOperations.updateComplaintStatus(
      db,
      complaintId,
      statusData,
      userId,
      userRole
    );

    if (status === 'resolved') {
      try {
        const submitter = await userOperations.findById(db, complaint.userId);
        if (submitter) {
          await userOperations.addNotification(db, submitter._id, {
            type: 'complaint_resolved',
            title: 'Complaint resolved',
            message: `Your complaint "${complaint.title}" has been marked as resolved.`,
            complaintId: complaint._id.toString(),
            route: `/complaints/${complaint._id.toString()}`,
          });

          if (submitter.email) {
            await emailService.sendNotificationEmail(
              submitter.email,
              'Your complaint has been resolved',
              `We have resolved your complaint titled "${complaint.title}". Thank you for raising it.`,
              {
                route: `/complaints/${complaint._id.toString()}`,
                role: submitter.normalizedRole || submitter.role,
              }
            );
          }
        }
      } catch (resolveError) {
        console.warn('Could not notify submitter about resolution:', resolveError.message);
      }
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message:
          'Complaint not found or you do not have permission to update it',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating complaint status',
    });
  }
};

// @desc    Get all complaints (admin/estates only)
// @route   GET /api/complaints/all
// @access  Private/Admin or Estates Officer
export const getAllComplaints = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userRole = req.user.normalizedRole || req.user.role;

    // Check permission
    const allowedRoles = ['admin', 'estates_officer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view all complaints',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status || 'all';
    const category = req.query.category || 'all';
    const timeRange = req.query.timeRange || 'all';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const result = await complaintOperations.getAllComplaints(
      db,
      page,
      limit,
      status,
      category,
      timeRange,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      count: result.complaints.length,
      pagination: result.pagination,
      data: result.complaints,
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints',
    });
  }
};

// @desc    Get complaint statistics for dashboard
// @route   GET /api/complaints/stats
// @access  Private
export const getComplaintStats = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;

    const timeRange = req.query.timeRange || 'all';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const stats = await complaintOperations.getComplaintStats(
      db,
      userId,
      userRole,
      timeRange,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get complaint stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
    });
  }
};

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
// @access  Private (user can delete their own pending complaints)
export const deleteComplaint = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const userRole = req.user.normalizedRole || req.user.role;
    const complaintId = req.params.id;

    if (!ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const deleted = await complaintOperations.deleteComplaint(
      db,
      complaintId,
      userId,
      userRole
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or cannot be deleted',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting complaint',
    });
  }
};
