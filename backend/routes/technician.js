import express from 'express';
import { body, param } from 'express-validator';
import { ObjectId } from 'mongodb';
import { validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Middleware: Ensure user is a technician
const technicianOnly = (req, res, next) => {
  const userRole = (req.user?.normalizedRole || req.user?.role || '').toLowerCase();
  if (!['technician', 'tech'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Technician role required.',
    });
  }
  next();
};

// GET /api/technician/tasks - Get all tasks assigned to logged-in technician
router.get(
  '/tasks',
  protect,
  technicianOnly,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const technicianId = req.user._id;
      const { status } = req.query; // optional: filter by status

      const complaints = db.collection('complaints');

      // Build query: find complaints with tasks assigned to this technician
      const query = {
        'tasks.assigneeId': technicianId,
      };

      if (status && status !== 'all') {
        // Map frontend status to backend status
        const statusMap = {
          'Assigned': 'open',
          'In Progress': 'in_progress',
          'Resolved': 'done',
          'Pending': 'blocked',
        };
        query['tasks.status'] = statusMap[status] || status;
      }

      const results = await complaints
        .aggregate([
          { $match: query },
          {
            $project: {
              complaintId: '$complaintId',
              complaintTitle: '$title',
              complaintDescription: '$description',
              complaintCategory: '$category',
              complaintLocation: '$location || $scopeDefinition.location',
              tasks: {
                $filter: {
                  input: '$tasks',
                  as: 'task',
                  cond: { $eq: ['$$task.assigneeId', technicianId] },
                },
              },
            },
          },
          { $unwind: '$tasks' },
          {
            $project: {
              _id: '$tasks._id',
              complaintId: 1,
              complaintLabel: '$complaintId',
              taskId: '$tasks._id',
              title: '$tasks.title',
              description: '$tasks.description',
              status: '$tasks.status',
              priority: '$tasks.priority',
              estimatedDurationDays: '$tasks.estimatedDurationDays',
              startDate: '$tasks.startDate',
              deadline: '$tasks.deadline',
              completedAt: '$tasks.completedAt',
              assigneeName: '$tasks.assigneeName',
              assignedAt: '$tasks.assignedAt',
              location: '$complaintLocation',
              complaintTitle: 1,
              createdAt: '$tasks.createdAt',
              notes: '$tasks.notes',
              workReport: '$tasks.workReport',
              pendingInfo: '$tasks.pendingInfo',
            },
          },
          { $sort: { deadline: 1 } },
        ])
        .toArray();

      // Format response
      const tasks = results.map((doc) => ({
        id: doc._id.toString(),
        taskId: doc.taskId.toString(),
        complaintId: doc.complaintId.toString(),
        complaintLabel: doc.complaintLabel || doc.complaintId.toString(),
        title: doc.title,
        description: doc.description,
        status: doc.status, // 'open', 'in_progress', 'done', 'blocked'
        priority: doc.priority,
        location: doc.location,
        assignedTo: doc.assigneeName,
        dueDate: doc.deadline?.toISOString(),
        createdAt: doc.createdAt?.toISOString(),
        estimatedDurationDays: doc.estimatedDurationDays,
        workReport: doc.workReport,
        pendingInfo: doc.pendingInfo,
        complaintTitle: doc.complaintTitle,
      }));

      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      console.error('Error fetching technician tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching tasks',
      });
    }
  }
);

// GET /api/technician/tasks/:complaintId/:taskId - Get task details
router.get(
  '/tasks/:complaintId/:taskId',
  protect,
  technicianOnly,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const technicianId = req.user._id;
      const { complaintId, taskId } = req.params;

      if (!complaintId || !ObjectId.isValid(taskId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID or task ID',
        });
      }

      const complaints = db.collection('complaints');
      const complaintQuery = ObjectId.isValid(complaintId)
        ? { $or: [{ _id: new ObjectId(complaintId) }, { complaintId }] }
        : { complaintId };

      const complaint = await complaints.findOne(complaintQuery);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found',
        });
      }

      const task = (complaint.tasks || []).find(
        (t) => t._id.toString() === taskId && t.assigneeId.toString() === technicianId.toString()
      );

      if (!task) {
        return res.status(403).json({
          success: false,
          message: 'Task not found or not assigned to you',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: task._id.toString(),
          complaintId: complaintId,
          complaintLabel: complaint.complaintId || complaint.complaintNumber || complaintId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimatedDurationDays: task.estimatedDurationDays,
          startDate: task.startDate?.toISOString(),
          deadline: task.deadline?.toISOString(),
          completedAt: task.completedAt?.toISOString(),
          assigneeName: task.assigneeName,
          createdAt: task.createdAt?.toISOString(),
          notes: task.notes,
          workReport: task.workReport,
          pendingInfo: task.pendingInfo,
          complaintTitle: complaint.title,
          complaintDescription: complaint.description,
          complaintCategory: complaint.category,
          complaintLocation: complaint.scopeDefinition?.location || complaint.location,
          activityLog: task.activityLog || [],
        },
      });
    } catch (error) {
      console.error('Error fetching task details:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching task details',
      });
    }
  }
);

// PATCH /api/technician/tasks/:complaintId/:taskId/status - Update task status
router.patch(
  '/tasks/:complaintId/:taskId/status',
  protect,
  technicianOnly,
  [
    param('complaintId').notEmpty().withMessage('Invalid complaint ID'),
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('status')
      .notEmpty()
      .isIn(['open', 'in_progress', 'done', 'blocked'])
      .withMessage('Status must be: open, in_progress, done, or blocked'),
    body('workReport').optional().isObject(),
    body('pendingInfo').optional().isObject(),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const technicianId = req.user._id;
      const { complaintId, taskId } = req.params;
      const { status, workReport, pendingInfo, notes } = req.body;

      if (!complaintId || !ObjectId.isValid(taskId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID or task ID',
        });
      }

      const complaints = db.collection('complaints');
      const complaintQuery = ObjectId.isValid(complaintId)
        ? { $or: [{ _id: new ObjectId(complaintId) }, { complaintId }] }
        : { complaintId };

      const complaint = await complaints.findOne(complaintQuery);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found',
        });
      }

      const task = (complaint.tasks || []).find(
        (t) => t._id.toString() === taskId
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      // Verify task is assigned to technician
      if (task.assigneeId.toString() !== technicianId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Task not assigned to you',
        });
      }

      // Build update object
      const updateFields = {
        'tasks.$.status': status,
        'tasks.$.updatedAt': new Date(),
      };

      if (status === 'done') {
        updateFields['tasks.$.completedAt'] = new Date();
      }

      if (status === 'in_progress' && !task.startedAt) {
        updateFields['tasks.$.startedAt'] = new Date();
      }

      if (workReport) {
        updateFields['tasks.$.workReport'] = {
          actionsTaken: workReport.actionsTaken,
          materialsUsed: workReport.materialsUsed || [],
          hoursSpent: workReport.hoursSpent,
          submittedAt: new Date(),
          submittedBy: technicianId,
        };
      }

      if (pendingInfo) {
        updateFields['tasks.$.pendingInfo'] = {
          partsNeeded: pendingInfo.partsNeeded,
          delayReason: pendingInfo.delayReason,
          submittedAt: new Date(),
          submittedBy: technicianId,
        };
      }

      if (notes) {
        updateFields['tasks.$.notes'] = notes;
      }

      // Add activity log entry
      const activityEntry = {
        action: `status_${status}`,
        timestamp: new Date(),
        by: technicianId,
        previousStatus: task.status,
        newStatus: status,
        notes: notes || null,
      };

      const result = await complaints.updateOne(
        { _id: new ObjectId(complaintId), 'tasks._id': new ObjectId(taskId) },
        {
          $set: updateFields,
          $push: { 'tasks.$.activityLog': activityEntry },
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update task status',
        });
      }

      // Fetch updated complaint to return updated task
      const updatedComplaint = await complaints.findOne({
        _id: new ObjectId(complaintId),
      });

      const updatedTask = (updatedComplaint.tasks || []).find(
        (t) => t._id.toString() === taskId
      );

      res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: {
          id: updatedTask._id.toString(),
          status: updatedTask.status,
          workReport: updatedTask.workReport,
          pendingInfo: updatedTask.pendingInfo,
          completedAt: updatedTask.completedAt?.toISOString(),
          updatedAt: updatedTask.updatedAt?.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating task status',
      });
    }
  }
);

export default router;
