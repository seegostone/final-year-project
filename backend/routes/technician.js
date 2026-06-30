import express from 'express';
import { body, param } from 'express-validator';
import { ObjectId } from 'mongodb';
import { validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

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

const getTaskIdentifier = (task) => {
  return task._id?.toString?.() || task.taskCode || task.taskId || task.id;
};

const buildTaskFilter = (taskId) => {
  const filters = [];
  if (ObjectId.isValid(taskId)) {
    filters.push({ 'tasks._id': new ObjectId(taskId) });
  }
  filters.push({ 'tasks.taskCode': taskId }, { 'tasks.taskId': taskId }, { 'tasks.id': taskId });
  return { $or: filters };
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
              complaintId: '$_id',
              complaintTitle: '$title',
              complaintDescription: '$description',
              complaintCategory: '$category',
              complaintLocation: '$location',
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
              taskCode: '$tasks.taskCode',
              taskNumber: '$tasks.taskNumber',
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
        taskNumber: doc.taskNumber,
        complaintId: doc.complaintId.toString(),
        complaintLabel: doc.complaintLabel || doc.complaintId.toString(),
        taskCode: doc.taskCode || doc.taskId.toString(),
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

      if (!complaintId || !taskId) {
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

      // Find the task assigned to this technician
      const task = (complaint.tasks || []).find((t) => {
        const currentTaskId = t._id?.toString?.() || t.taskCode || t.taskId || t.id;
        return currentTaskId === taskId && String(t.assigneeId) === String(technicianId);
      });

      if (!task) {
        return res.status(403).json({
          success: false,
          message: 'Task not found or not assigned to you',
        });
      }

      // If the task does not have a stored taskNumber (older data), compute a fallback
      // by ordering the complaint's tasks by creation time and using the index.
      let effectiveTaskNumber = task.taskNumber;
      try {
        if (typeof effectiveTaskNumber !== 'number') {
          const tasksSorted = (complaint.tasks || [])
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const idx = tasksSorted.findIndex((t) => t._id.toString() === taskId);
          if (idx >= 0) effectiveTaskNumber = idx + 1;
        }
      } catch (e) {
        // ignore sorting errors and leave effectiveTaskNumber undefined
      }

      const effectiveTaskCode = task.taskCode || `${complaint.complaintId || complaint.complaintNumber || complaintId}-TASK-${String(effectiveTaskNumber || task._id.toString()).padStart ? String(effectiveTaskNumber).padStart(3,'0') : task._id.toString()}`;

      res.status(200).json({
        success: true,
        data: {
          id: task._id.toString(),
          complaintId: complaintId,
          complaintLabel: complaint.complaintId || complaint.complaintNumber || complaintId,
          taskCode: effectiveTaskCode,
          taskNumber: effectiveTaskNumber,
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
    param('taskId').notEmpty().withMessage('Invalid task ID'),
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

      if (!complaintId || !taskId) {
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

      const task = (complaint.tasks || []).find((t) => {
        const currentTaskId = t._id?.toString?.() || t.taskCode || t.taskId || t.id;
        return currentTaskId === taskId;
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      // Verify task is assigned to technician
      if (String(task.assigneeId) !== String(technicianId)) {
        return res.status(403).json({
          success: false,
          message: 'Task not assigned to you',
        });
      }

      // Build update object (use arrayFilters placeholder `t` when updating non-_id matches)
      const updateFields = {
        'tasks.$[t].status': status,
        'tasks.$[t].updatedAt': new Date(),
      };

      if (status === 'done') {
        updateFields['tasks.$[t].completedAt'] = new Date();
      }

      if (status === 'in_progress' && !task.startedAt) {
        updateFields['tasks.$[t].startedAt'] = new Date();
      }

      if (workReport) {
        updateFields['tasks.$[t].workReport'] = {
          actionsTaken: workReport.actionsTaken,
          materialsUsed: workReport.materialsUsed || [],
          hoursSpent: workReport.hoursSpent,
          submittedAt: new Date(),
          submittedBy: technicianId,
        };
      }

      if (pendingInfo) {
        updateFields['tasks.$[t].pendingInfo'] = {
          partsNeeded: pendingInfo.partsNeeded,
          delayReason: pendingInfo.delayReason,
          submittedAt: new Date(),
          submittedBy: technicianId,
        };
      }

      if (notes) {
        updateFields['tasks.$[t].notes'] = notes;
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

      const combinedQuery = { $and: [complaintQuery, buildTaskFilter(taskId)] };

      // Prepare arrayFilters to match the correct task element by _id or alternative identifiers
      const taskArrayFilter = ObjectId.isValid(taskId)
        ? { $or: [{ 't._id': new ObjectId(taskId) }, { 't.taskCode': taskId }, { 't.taskId': taskId }, { 't.id': taskId }] }
        : { $or: [{ 't.taskCode': taskId }, { 't.taskId': taskId }, { 't.id': taskId }] };

      const result = await complaints.updateOne(
        complaintQuery,
        {
          $set: updateFields,
          $push: { 'tasks.$[t].activityLog': activityEntry },
        },
        { arrayFilters: [taskArrayFilter] }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update task status',
        });
      }

      // Fetch updated complaint to return updated task
      let updatedComplaint = await complaints.findOne(complaintQuery);

      const updatedTask = (updatedComplaint.tasks || []).find((t) => getTaskIdentifier(t) === taskId);

      if (status === 'done') {
        const allTasksDone = (updatedComplaint.tasks || []).length > 0 &&
          (updatedComplaint.tasks || []).every((t) => t.status === 'done');

        if (allTasksDone && !['resolved', 'closed', 'validated', 'rework_required'].includes(updatedComplaint.status)) {
          const resolvedHistory = {
            action: 'auto_resolved',
            from: updatedComplaint.status,
            to: 'resolved',
            by: technicianId,
            byName: 'Technician',
            byRole: 'technician',
            at: new Date(),
            note: 'All tasks completed. Complaint automatically moved to resolved.',
          };

          await complaints.updateOne(
            { ...complaintQuery },
            {
              $set: {
                status: 'resolved',
                resolvedAt: new Date(),
                updatedAt: new Date(),
              },
              $push: { history: resolvedHistory },
            }
          );

          updatedComplaint = await complaints.findOne(complaintQuery);
        }
      }

      if (status === 'done' || status === 'blocked') {
        try {
          const officers = await db.collection('users')
            .find({ role: { $in: ['estates_officer', 'admin'] }, isActive: true })
            .toArray();

          await Promise.allSettled(
            officers.map(async (officer) => {
              const notificationType = status === 'done' ? 'task_completed' : 'task_blocked';
              const notificationTitle = status === 'done'
                ? 'Technician completed a task'
                : 'Technician reported an issue';
              const notificationMessage = status === 'done'
                ? `Technician completed task "${task.title}" for complaint ${complaint.complaintId || complaint._id.toString()}.`
                : `Technician marked task "${task.title}" as pending and requires attention for complaint ${complaint.complaintId || complaint._id.toString()}.`;

              await db.collection('users').updateOne(
                { _id: officer._id },
                {
                  $push: {
                    notifications: {
                      $each: [
                        {
                          _id: new ObjectId(),
                          type: notificationType,
                          title: notificationTitle,
                          message: notificationMessage,
                          complaintId: complaint._id.toString(),
                          taskId,
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
                  notificationTitle,
                  notificationMessage,
                  {
                    route: '/management/queue',
                    role: officer.normalizedRole || officer.role,
                  }
                );
              }
            })
          );
        } catch (notifyError) {
          console.warn('Task status notification failed:', notifyError);
        }
      }

      const finalTask = (updatedComplaint.tasks || []).find((t) => getTaskIdentifier(t) === taskId);

      res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: {
          id: finalTask._id.toString(),
          status: finalTask.status,
          workReport: finalTask.workReport,
          pendingInfo: finalTask.pendingInfo,
          completedAt: finalTask.completedAt?.toISOString(),
          updatedAt: finalTask.updatedAt?.toISOString(),
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
