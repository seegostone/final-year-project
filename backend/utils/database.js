import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Normalize roles to stable internal identifiers, e.g. 'Resident Staff' -> 'resident_staff'
function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') || 'user';
}

export async function createDatabaseIndexes(db) {
  const users = db.collection('users');
  const complaints = db.collection('complaints');
  
  await users.createIndexes([
    {
      key: { email: 1 },
      name: 'idx_users_email_unique',
      unique: true,
    },
    {
      key: { role: 1, isActive: 1 },
      name: 'idx_users_role_active',
    },
    {
      key: { normalizedRole: 1, isActive: 1 },
      name: 'idx_users_normalizedRole_active',
    },
  ]);

  await complaints.createIndexes([
    {
      key: { userId: 1, createdAt: -1 },
      name: 'idx_complaints_user_createdAt',
    },
    {
      key: { status: 1, createdAt: -1 },
      name: 'idx_complaints_status_createdAt',
    },
    {
      key: { category: 1, createdAt: -1 },
      name: 'idx_complaints_category_createdAt',
    },
    {
      key: { status: 1, priority: 1, slaDeadline: 1, createdAt: -1 },
      name: 'idx_complaints_queue',
    },
    {
      key: { assignedTo: 1, status: 1 },
      name: 'idx_complaints_assigned_status',
    },
  ]);
}

// Atomic sequence helper for generating unique sequential IDs
async function getNextSequence(db, name) {
  const counters = db.collection('counters');
  try {
    const res = await counters.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );

    if (res?.value?.seq !== undefined && typeof res.value.seq === 'number') {
      return res.value.seq;
    }

    // Fallback: try to read it directly
    const counter = await counters.findOne({ _id: name });
    if (counter && typeof counter.seq === 'number') {
      return counter.seq;
    }

    // If still no counter, initialize it
    await counters.updateOne(
      { _id: name },
      { $set: { seq: 1 } },
      { upsert: true }
    );
    return 1;
  } catch (error) {
    console.error(`[getNextSequence] Error for counter ${name}:`, error.message);
    throw error;
  }
}

async function getNextTaskSequence(db, complaintId) {
  const counterName = `complaintTaskCounter:${complaintId}`;
  return await getNextSequence(db, counterName);
}

function buildCreatedAtFilter(timeRange, startDate, endDate) {
  if (!timeRange || timeRange === 'all') return null;

  const normalized = timeRange.toString().trim().toLowerCase();
  const now = new Date();

  if (normalized === 'custom') {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  if (normalized === 'today') {
    return { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
  }

  if (normalized === 'yesterday') {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { $gte: yesterday, $lte: endOfYesterday };
  }

  if (normalized === 'thisweek') {
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return { $gte: startOfWeek };
  }

  if (normalized === 'lastweek') {
    const dayOfWeek = now.getDay();
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - dayOfWeek - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);
    return { $gte: startOfLastWeek, $lte: endOfLastWeek };
  }

  if (normalized === 'thismonth') {
    return { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }

  if (normalized === 'lastmonth') {
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth };
  }

  if (normalized === 'last30days') {
    return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }

  if (normalized === 'last7days') {
    return { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  if (normalized === 'thisyear') {
    return { $gte: new Date(now.getFullYear(), 0, 1) };
  }

  return null;
}
//this function builds a MongoDB query object for complaints based on provided filters (userId, status, category, timeRange)
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildComplaintQuery({
  userId = null,
  status = null,
  category = null,
  timeRange = null,
  search = null,
  startDate = null,
  endDate = null,
} = {}) {
  const query = {};

  if (userId) {
    query.userId = new ObjectId(userId);
  }

  if (status && status !== 'all') {
    query.status =
      status === 'pending' ? { $in: ['pending', 'assigned'] } : status;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  const createdAtFilter = buildCreatedAtFilter(timeRange, startDate, endDate);
  if (createdAtFilter) {
    query.createdAt = createdAtFilter;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const normalizedSearch = search.trim();
    query.$or = [
      { title: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
      { location: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
      { category: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
    ];
  }

  return query;
}

// Helper to build a history entry for complaint status changes
function buildHistoryEntry({
  action,
  from = null,
  to,
  by,
  byName = 'System',
  byRole,
  note = null,
} = {}) {
  const byObjectId = by instanceof ObjectId ? by : new ObjectId(by);

  return {
    action,
    from,
    to,
    by: byObjectId,
    byName,
    byRole,
    at: new Date(),
    note,
  };
}

// User operations
export const userOperations = {
  // Create a new user
  async createUser(db, userData) {
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const normalizedRole = normalizeRole(userData.role);
    const user = {
      ...userData,
      _id: new ObjectId(),
      role: normalizedRole || 'user',
      normalizedRole: normalizedRole || 'user',
      specialization: (userData.specialization && userData.specialization.trim()) || null,
      zone: (userData.zone && userData.zone.trim()) || null,
      skills: Array.isArray(userData.skills)
        ? userData.skills.filter(Boolean)
        : userData.skills
          ? [userData.skills]
          : [],
      isActive: true,
      lastLogin: null,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      emailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpire: null,
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(user);
    return { ...user, _id: result.insertedId };
  },

  // Find user by email
  async findByEmail(db, email) {
    const users = db.collection('users');
    return await users.findOne({ email });
  },

  // Find user by ID
  async findById(db, id) {
    const users = db.collection('users');
    return await users.findOne({ _id: new ObjectId(id) });
  },

  // Get active open/in-progress task count for a technician
  async getTechnicianActiveTaskCount(db, technicianId) {
    const complaints = db.collection('complaints');
    const result = await complaints
      .aggregate([
        { $unwind: '$tasks' },
        {
          $match: {
            'tasks.assigneeId': new ObjectId(technicianId),
            'tasks.status': { $in: ['open', 'in_progress'] },
          },
        },
        { $count: 'activeCount' },
      ])
      .toArray();

    return result[0]?.activeCount || 0;
  },

  // Verify technician eligibility for complaint category and capacity
  async isTechnicianEligible(db, technicianId, category, maxActiveTasks = 2) {
    const user = await this.findById(db, technicianId);
    if (!user || !user.isActive) return false;

    const role = normalizeRole(user.role);
    if (role !== 'technician') return false;

    const activeTaskCount = await this.getTechnicianActiveTaskCount(db, technicianId);
    if (activeTaskCount >= maxActiveTasks) return false;

    if (!category) return true;

    const normalize = (value) => String(value || '').trim().toLowerCase();
    const categoryKey = normalize(category);
    const specialization = normalize(user.specialization || user.trade);
    const skills = Array.isArray(user.skills)
      ? user.skills.map((skill) => normalize(skill))
      : [];

    if (!specialization && skills.length === 0) return true;
    if (specialization === categoryKey) return true;
    if (normalize(user.trade) === categoryKey) return true;
    if (skills.includes(categoryKey)) return true;
    if (skills.some((skill) => skill.includes(categoryKey))) return true;

    return false;
  },

  // Update user
  async updateUser(db, id, updateData) {
    const users = db.collection('users');

    // Normalize role if provided
    if (updateData.role) {
      updateData.role = normalizeRole(updateData.role);
    }

    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    return await users.findOne({ _id: new ObjectId(id) });
  },

  // Update last login
  async updateLastLogin(db, id) {
    const users = db.collection('users');
    await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  },

  // Add a notification to a user
  async addNotification(db, userId, notificationData) {
    const users = db.collection('users');
    const notification = {
      _id: new ObjectId(),
      type: notificationData.type || 'info',
      title: notificationData.title || 'Notification',
      message: notificationData.message || '',
      complaintId: notificationData.complaintId || null,
      taskId: notificationData.taskId || null,
      route: notificationData.route || null,
      isRead: false,
      createdAt: new Date(),
    };

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: { notifications: { $each: [notification], $position: 0 } },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount > 0 ? notification : null;
  },

  async getNotifications(db, userId, { unreadOnly = false, limit = 20, skip = 0 } = {}) {
    const users = db.collection('users');
    const projection = { notifications: 1 };
    const user = await users.findOne({ _id: new ObjectId(userId) }, { projection });
    if (!user) return [];

    let notifications = Array.isArray(user.notifications) ? user.notifications : [];
    if (unreadOnly) {
      notifications = notifications.filter((item) => !item.isRead);
    }

    return notifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);
  },

  async getUnreadNotificationsCount(db, userId) {
    const users = db.collection('users');
    const projection = { notifications: 1 };
    const user = await users.findOne({ _id: new ObjectId(userId) }, { projection });
    if (!user || !Array.isArray(user.notifications)) return 0;
    return user.notifications.filter((item) => !item.isRead).length;
  },

  async markNotificationRead(db, userId, notificationId) {
    const users = db.collection('users');
    const result = await users.updateOne(
      { _id: new ObjectId(userId), 'notifications._id': new ObjectId(notificationId) },
      {
        $set: {
          'notifications.$.isRead': true,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  },

  async markAllNotificationsRead(db, userId) {
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) }, { projection: { notifications: 1 } });
    if (!user || !Array.isArray(user.notifications) || user.notifications.length === 0) {
      return false;
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'notifications.$[].isRead': true,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  },

  // Get users with pagination
  async getUsers(db, page = 1, limit = 10) {
    const users = db.collection('users');
    const skip = (page - 1) * limit;

    const total = await users.countDocuments();
    const userList = await users
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      users: userList,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // Deactivate user (soft delete)
  async deactivateUser(db, id) {
    const users = db.collection('users');
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  },

  // Set reset password token
  async setResetPasswordToken(db, email) {
    const users = db.collection('users');
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await users.updateOne(
      { email },
      {
        $set: {
          resetPasswordToken,
          resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          updatedAt: new Date(),
        },
      }
    );

    return resetToken;
  },

  // Reset password
  async resetPassword(db, token, newPassword) {
    const users = db.collection('users');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await users.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return null;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpire: null,
          updatedAt: new Date(),
        },
      }
    );

    return user;
  },

  // Set email verification token
  async setEmailVerificationToken(db, email) {
    const users = db.collection('users');
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    await users.updateOne(
      { email },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpire: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          updatedAt: new Date(),
        },
      }
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `Email verification token for ${email}: ${verificationToken}`
      );
    }

    return verificationToken;
  },

  // Verify email
  async verifyEmail(db, token) {
    const users = db.collection('users');
    const verificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('Verifying email with token:', token);

    // Find the user
    const user = await users.findOne({
      emailVerificationToken: verificationToken,
    });

    if (!user) {
      return null;
    }

    // Validate conditions
    if (user.emailVerified) {
      return null;
    }

    if (user.emailVerificationExpire < new Date()) {
      return null;
    }

    // Perform the update
    const updateResult = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpire: null,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return null;
    }

    // Return the updated user (without password)
    const updatedUser = await users.findOne(
      { _id: user._id },
      { projection: { password: 0 } }
    );

    return updatedUser;
  },
};

// Password utilities
export const passwordUtils = {
  // Hash password
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  // Compare password
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
};

// JWT utilities
export const jwtUtils = {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });
  },

  // Verify JWT token
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },
};

// inside database.js (near complaintOperations)
// ============ database.js ============
// ============ database.js ============

// Complaint operations
export const complaintOperations = {
  // Create a new complaint
  async createComplaint(db, complaintData, userId, userRole) {
    const complaints = db.collection('complaints');

    // Generate complaint ID (CMP-001 format)

    const nextNumber = await getNextSequence(db, 'complaints');
    const complaintId = `CMP-${String(nextNumber).padStart(3, '0')}`;

    const allowedUrgencies = ['Low', 'Medium', 'High', 'Critical'];
    const urgency = allowedUrgencies.includes(complaintData.urgency)
      ? complaintData.urgency
      : 'Medium';

    const attachments = [];
    if (complaintData.imageData) {
      attachments.push({
        type: 'image',
        url: complaintData.imageData,
        uploadedAt: new Date(),
      });
    }

    const complaint = {
      complaintId: complaintId,
      complaintNumber: nextNumber,
      userId: new ObjectId(userId),
      userRole: userRole,
      title: complaintData.title,
      location: complaintData.location,
      category: complaintData.category,
      urgency,
      description: complaintData.description,
      status: 'pending', // pending, triaged, analyzed, scope_defined, assigned, in-progress, resolved, validated, rework_required, escalated, closed
      attachments,
      hasAttachment: attachments.length > 0,
      imageData: complaintData.imageData || null,

      // Workflow fields
      priority: null,
      slaDeadline: null,

      // Assignment fields
      assignedTo: null,
      assignedAt: null,
      assignment: null,  // { technicianId, technicianName, assignedAt, confirmed }

      // Resolution fields
      resolvedAt: null,
      resolutionNotes: null,
      closedAt: null,
      closedBy: null,

      // Scope definition
      scopeDefinition: null,  // { description, estimatedDuration, requiredSkills, estimatedCost, dependencies }

      // Tasks array (for work breakdown)
      tasks: [],

      // Resident validation / Approval workflow
      residentValidation: {
        requestedAt: null,
        requestedBy: null,
        requestMessage: null,
        isPending: false,
        completedAt: null,
        approvedBy: null,
        status: null,  // ACCEPTED, REJECTED, PARTIAL
        feedback: null,
        satisfactionRating: null,
        rejectionReason: null,
      },

      // Quality check
      qualityCheck: null,  // { checkedBy, checkedAt, status, notes, photos }

      // Escalation
      escalation: null,  // { status, escalatedTo, escalatedAt, reason }

      // Rework tracking
      reworkCount: 0,
      reworkHistory: [],

      // Closure report
      closureReport: {
        summary: null,
        preventiveRecommendations: [],
        costActual: 0,
        timeToResolve: null,
      },

      // Performance metrics
      metrics: {
        slaMetCompliance: null,
        totalHandlingTime: null,
      },

      // History log
      history: [
        buildHistoryEntry({
          action: 'submitted',
          from: null,
          to: 'pending',
          by: userId,
          byName: complaintData.submitterName || 'Resident',
          byRole: userRole,
          note: 'Complaint submitted',
        }),
      ],

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await complaints.insertOne(complaint);
    return { ...complaint, _id: result.insertedId };
  },

  // Get complaints by user ID (users see only their own)
  async getUserComplaints(
    db,
    userId,
    page = 1,
    limit = 10,
    status = null,
    timeRange = null,
    category = null,
    search = null,
    startDate = null,
    endDate = null
  ) {
    const complaints = db.collection('complaints');
    const skip = (page - 1) * limit;

    const query = buildComplaintQuery({
      userId,
      status,
      category,
      timeRange,
      search,
      startDate,
      endDate,
    });

    const pipeline = [
      { $match: query },
      {
        $facet: {
          complaints: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await complaints.aggregate(pipeline).toArray();
    const stats = result[0] || { complaints: [], totalCount: [] };
    const total = stats.totalCount[0]?.count || 0;
    const complaintsList = stats.complaints || [];

    return {
      complaints: complaintsList,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComplaints: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // Get complaint by ID (with ownership check)
  async getComplaintById(db, complaintId, userId, userRole) {
    const complaints = db.collection('complaints');
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });

    if (!complaint) return null;

    // Check ownership: user can only see their own complaints unless they're admin/estates staff
    if (
      complaint.userId.toString() !== userId.toString() &&
      userRole !== 'admin' &&
      userRole !== 'estates_officer'
    ) {
      return null;
    }

    return complaint;
  },

  // Update complaint status (for estates staff)
  async updateComplaintStatus(db, complaintId, statusData, userId, userRole) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    const allowedRoles = ['admin', 'estates_officer', 'warden'];
    if (!allowedRoles.includes(userRole)) return null;

    const nextStatus = statusData.status;
    const validStatuses = ['pending', 'assigned', 'in-progress', 'resolved'];
    if (!validStatuses.includes(nextStatus)) return null;

    const validTransitions = {
      pending: ['assigned'],
      assigned: ['in-progress', 'resolved'],
      'in-progress': ['resolved'],
      resolved: [],
    };

    const currentStatus = complaint.status;
    if (currentStatus === nextStatus) {
      return complaint;
    }

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      return null;
    }

    const updateFields = {
      status: nextStatus,
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: `status_${nextStatus}`,
      from: currentStatus,
      to: nextStatus,
      by: userId,
      byName: statusData.staffName || 'Staff Member',
      byRole: userRole,
      note: statusData.note || null,
    });


    if (nextStatus === 'assigned') {
      if (!statusData.assignedTo) return null;
      updateFields.assignedTo = statusData.assignedTo;
      updateFields.assignedAt = new Date();
      historyEntry.assignedToName = statusData.assignedToName || 'Unknown';
    }

    if (nextStatus === 'resolved') {
      updateFields.resolvedAt = new Date();
      updateFields.resolutionNotes = statusData.resolutionNotes || null;
    }

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Get all complaints (for estates staff/admin)
  async getAllComplaints(
    db,
    page = 1,
    limit = 10,
    status = null,
    category = null,
    timeRange = null
  ) {
    const complaints = db.collection('complaints');
    const skip = (page - 1) * limit;

    const query = buildComplaintQuery({
      status,
      category,
      timeRange,
    });

    const total = await complaints.countDocuments(query);
    const complaintsList = await complaints
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get user details for each complaint
    const users = db.collection('users');
    const complaintsWithUsers = await Promise.all(
      complaintsList.map(async (complaint) => {
        const user = await users.findOne(
          { _id: complaint.userId },
          { projection: { name: 1, email: 1, role: 1 } }
        );
        return {
          ...complaint,
          user: user || { name: 'Unknown', email: 'Unknown', role: 'Unknown' },
        };
      })
    );

    return {
      complaints: complaintsWithUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComplaints: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // Get complaint statistics for dashboard
  async getComplaintStats(
    db,
    userId = null,
    userRole = null,
    timeRange = null,
    startDate = null,
    endDate = null
  ) {
    const complaints = db.collection('complaints');

    const pipeline = [];
    // Determine whether to scope stats to a specific user or all complaints
    const isAdmin = userRole === 'admin' || userRole === 'estates_officer';

    // If caller is admin/estates, do not include userId in the query (global stats).
    // Otherwise scope to the provided userId.
    const query = buildComplaintQuery({
      userId: isAdmin ? null : userId,
      timeRange,
      startDate,
      endDate,
    });

    if (Object.keys(query).length) {
      pipeline.push({ $match: query });
    }

    // Group and count by status in one pass
    pipeline.push({
      $facet: {
        total: [{ $count: 'count' }],
        pending: [
          { $match: { status: { $in: ['pending', 'assigned'] } } },
          { $count: 'count' },
        ],
        inProgress: [
          { $match: { status: 'in-progress' } },
          { $count: 'count' },
        ],
        resolved: [{ $match: { status: 'resolved' } }, { $count: 'count' }],
      },
    });

    const result = await complaints.aggregate(pipeline).toArray();
    const stats = result[0];

    return {
      total: stats.total[0]?.count || 0,
      pending: stats.pending[0]?.count || 0,
      inProgress: stats.inProgress[0]?.count || 0,
      resolved: stats.resolved[0]?.count || 0,
    };
  },

  // Delete complaint (user can delete their own pending complaints)
  async deleteComplaint(db, complaintId, userId, userRole) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return false;

    // User can only delete their own complaints that are still pending
    const canDelete =
      (complaint.userId.toString() === userId.toString() &&
        complaint.status === 'pending') ||
      userRole === 'admin';

    if (!canDelete) return false;

    const result = await complaints.deleteOne({
      _id: new ObjectId(complaintId),
    });
    return result.deletedCount > 0;
  },
};

// Management operations (for Estates Officer/Admin features)
export const managementOperations = {
  // Validate complaint (Phase 1)
  async validateComplaint(db, complaintId, validationData) {
    const complaints = db.collection('complaints');

    // Query by MongoDB _id (ObjectId)
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    const updateFields = {
      status: 'analyzed',
      validationNotes: validationData.validationNotes,
      validatedBy: new ObjectId(validationData.validatedBy),
      validatedAt: new Date(),
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'validated',
      from: complaint.status,
      to: 'analyzed',
      by: validationData.validatedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: validationData.validationNotes || 'Complaint validated',
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },


  // ── addTaskToComplaint (ENHANCED) ────────────────────────────
  // Replace the existing addTaskToComplaint inside managementOperations

  async addTaskToComplaint(db, complaintId, taskData, createdBy) {
    const complaints = db.collection('complaints');
    const complaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    if (!complaint) return null;

    // Ensure task duration is a whole number of days (round up)
    const estimatedDurationDays = Number.isFinite(Number(taskData.estimatedDurationDays))
      ? Math.ceil(Number(taskData.estimatedDurationDays))
      : 1;

    // Duration validation against complaint scope
    const scopeDuration = complaint.scopeDefinition?.estimatedDuration;
    if (scopeDuration) {
      const existingTotal = (complaint.tasks || []).reduce(
        (sum, t) => sum + (t.estimatedDurationDays || 0), 0
      );
      if (existingTotal + estimatedDurationDays > scopeDuration) {
        throw new Error(
          `Task duration exceeds remaining scope capacity. Available: ${(scopeDuration - existingTotal).toFixed(2)} day(s). Requested: ${estimatedDurationDays} day(s).`
        );
      }
    }

    // Calculate deadline from startDate + estimatedDurationDays (whole days)
    const startDate = taskData.startDate ? new Date(taskData.startDate) : new Date();
    const deadline = new Date(startDate.getTime() + estimatedDurationDays * 24 * 60 * 60 * 1000);

    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const priority = allowedPriorities.includes(taskData.priority) ? taskData.priority : 'MEDIUM';

    const taskNumber = await getNextTaskSequence(db, complaint._id.toString());
    const taskCode = `${complaint.complaintId || 'CMP-000'}-TASK-${String(taskNumber).padStart(3, '0')}`;

    const task = {
      _id: new ObjectId(),
      taskNumber,
      taskCode,
      title: taskData.title || 'Task',
      description: taskData.description || '',
      status: 'open',           // open | in_progress | done | blocked
      priority,                 // LOW | MEDIUM | HIGH | CRITICAL
      estimatedDurationDays,
      startDate,
      deadline,
      completedAt: null,
      assigneeId: taskData.assigneeId ? new ObjectId(taskData.assigneeId) : null,
      assigneeName: taskData.assigneeName || null,
      assignedAt: taskData.assigneeId ? new Date() : null,
      notes: taskData.notes || null,
      createdBy: new ObjectId(createdBy),
      createdAt: new Date(),
    };
    console.log('addTaskToComplaint task', task);
    const historyEntry = buildHistoryEntry({
      action: 'task_created',
      from: complaint.status,
      to: complaint.status,
      by: createdBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Task created: ${task.title} (${estimatedDurationDays}d, Priority: ${priority})`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $push: { tasks: task, history: historyEntry },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) return null;
    console.log(`Task ${task.taskCode} added to complaint ${complaint.complaintId}`);
    return task;
  },



  // Add this as a new method inside managementOperations

  async updateTaskStatus(db, complaintId, taskId, statusData, updatedBy) {
    const complaints = db.collection('complaints');
    const complaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    if (!complaint) return null;

    const task = (complaint.tasks || []).find((t) => t._id.toString() === taskId);
    if (!task) return null;

    const allowedStatuses = ['open', 'in_progress', 'done', 'blocked'];
    if (!allowedStatuses.includes(statusData.status)) return null;

    const updateFields = {
      'tasks.$.status': statusData.status,
      updatedAt: new Date(),
    };

    if (statusData.status === 'done') {
      updateFields['tasks.$.completedAt'] = new Date();
    }
    if (statusData.notes) {
      updateFields['tasks.$.notes'] = statusData.notes;
    }

    const historyEntry = buildHistoryEntry({
      action: 'task_status_updated',
      from: complaint.status,
      to: complaint.status,
      by: updatedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Task "${task.title}" status -> ${statusData.status}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId), 'tasks._id': new ObjectId(taskId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    // After updating task, check if ALL tasks are now done
    const updatedComplaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    if (statusData.status === 'done' && updatedComplaint?.tasks) {
      const allTasksDone = updatedComplaint.tasks.length > 0 &&
        updatedComplaint.tasks.every(t => t.status === 'done');

      // If all tasks are done and complaint is not already resolved/closed, auto-transition to resolved
      if (allTasksDone && !['resolved', 'closed', 'validated', 'rework_required'].includes(updatedComplaint.status)) {
        const autoTransitionHistory = buildHistoryEntry({
          action: 'auto_resolved',
          from: updatedComplaint.status,
          to: 'resolved',
          by: updatedBy,
          byName: 'System',
          byRole: 'system',
          note: 'All tasks completed. Complaint automatically moved to resolved status.',
        });

        await complaints.updateOne(
          { _id: new ObjectId(complaintId) },
          {
            $set: {
              status: 'resolved',
              resolvedAt: new Date(),
              updatedAt: new Date(),
            },
            $push: { history: autoTransitionHistory },
          }
        );
      }
    }

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },





  // Triage complaint (Phase 1)
  async triageComplaint(db, complaintId, triageData) {
    const complaints = db.collection('complaints');

    // Query by MongoDB _id (ObjectId)
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    // Calculate SLA deadline based on priority but avoid overwriting
    // existing values set by other phases (e.g. scope definition or previous triage).
    const slaTiers = {
      CRITICAL: 1, // 1 day
      HIGH: 2, // 2 days
      MEDIUM: 5, // 5 days
      LOW: 10, // 10 days
    };

    const updateFields = { updatedAt: new Date() };

    // Only set priority if it's not already defined on the complaint
    if (!complaint.priority && triageData.priority) {
      updateFields.priority = triageData.priority;
    }

    // Only set SLA deadline if it's not already present
    if (!complaint.slaDeadline && triageData.priority) {
      const slaDays = slaTiers[triageData.priority] || 5;
      const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);
      updateFields.slaDeadline = slaDeadline;
    }

    // Only change status to 'triaged' when complaint is still pending
    if (complaint.status === 'pending') {
      updateFields.status = 'triaged';
    }

    // If nothing meaningful would be changed, return the complaint unchanged
    const meaningfulKeys = Object.keys(updateFields).filter((k) => k !== 'updatedAt');
    if (meaningfulKeys.length === 0) {
      return complaint;
    }

    const historyEntry = buildHistoryEntry({
      action: 'triaged',
      from: complaint.status,
      to: updateFields.status || complaint.status,
      by: triageData.triageBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Priority: ${updateFields.priority || complaint.priority || 'unchanged'}. ${triageData.triageNotes || ''}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Define scope for complaint (Phase 1)
  async defineScopeComplaint(db, complaintId, scopeData) {
    const complaints = db.collection('complaints');

    // Find the complaint
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    console.log('📋 [defineScopeComplaint] Found complaint:', complaint.complaintId);

    // Build the complete scopeDefinition object
    // Start with existing definition or empty object
    const existingScope = complaint.scopeDefinition || {};

    const parseStringArray = (value) => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
      }
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
      return [];
    };

    const newScopeDefinition = {
      description:
        scopeData.scopeDescription && scopeData.scopeDescription.trim().length > 0
          ? scopeData.scopeDescription.trim()
          : existingScope.description || '',
      estimatedDuration:
        scopeData.estimatedDuration !== undefined && scopeData.estimatedDuration !== null
          ? (Number.isFinite(Number(scopeData.estimatedDuration))
            ? Math.ceil(Number(scopeData.estimatedDuration))
            : existingScope.estimatedDuration || 0)
          : existingScope.estimatedDuration || 0,
      requiredSkills:
        parseStringArray(scopeData.requiredSkills).length > 0
          ? parseStringArray(scopeData.requiredSkills)
          : existingScope.requiredSkills || [],
      estimatedCost:
        scopeData.estimatedCost !== undefined && scopeData.estimatedCost !== null
          ? (Number.isFinite(Number(scopeData.estimatedCost))
            ? Number(scopeData.estimatedCost)
            : existingScope.estimatedCost || 0)
          : existingScope.estimatedCost || 0,
      dependencies:
        parseStringArray(scopeData.dependencies).length > 0
          ? parseStringArray(scopeData.dependencies)
          : existingScope.dependencies || [],
    };

    console.log('📝 [defineScopeComplaint] New scope definition:', newScopeDefinition);

    // Build update object - only parent paths, no dot notation
    const updateFields = {
      scopeDefinition: newScopeDefinition,
      updatedAt: new Date(),
    };

    // Update status if complaint is at the right stage
    if (['pending', 'triaged', 'analyzed'].includes(complaint.status)) {
      updateFields.status = 'scope_defined';
    }

    console.log('📝 [defineScopeComplaint] Update fields:', updateFields);

    // Create history entry
    const historyEntry = {
      action: 'scope_defined',
      from: complaint.status,
      to: updateFields.status || complaint.status,
      by: new ObjectId(scopeData.definedBy),
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      at: new Date(),
      note: scopeData.scopeDescription ? scopeData.scopeDescription.substring(0, 100) : 'Scope defined',
    };

    console.log('📋 [defineScopeComplaint] History entry:', historyEntry);

    // Update the complaint
    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    console.log('✅ [defineScopeComplaint] Update result:', result.modifiedCount, 'documents modified');

    if (result.modifiedCount === 0) {
      console.log('⚠️  [defineScopeComplaint] No documents were modified');
      return complaint;
    }

    // Fetch and return the updated complaint
    const updatedComplaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    console.log('✅ [defineScopeComplaint] Updated scope:', updatedComplaint?.scopeDefinition);
    return updatedComplaint;
  },

  // Assign a technician to a specific task inside a complaint
  async assignTaskToComplaint(db, complaintId, taskId, assigneeData, assignedBy) {
    const complaints = db.collection('complaints');
    const complaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    if (!complaint) return null;

    const taskFilter = ObjectId.isValid(taskId)
      ? { 'tasks._id': new ObjectId(taskId) }
      : { 'tasks._id': taskId };

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId), ...taskFilter },
      {
        $set: {
          'tasks.$.assigneeId': new ObjectId(assigneeData.technicianId),
          'tasks.$.assigneeName': assigneeData.technicianName,
          'tasks.$.assignedAt': new Date(),
          updatedAt: new Date(),
        },
        $push: {
          history: buildHistoryEntry({
            action: 'task_assigned',
            from: complaint.status,
            to: complaint.status,
            by: assignedBy,
            byName: 'Estates Officer',
            byRole: 'estates_officer',
            note: `Task ${taskId} assigned to ${assigneeData.technicianName}`,
          }),
        },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Unassign a technician from a specific task inside a complaint
  async unassignTaskFromComplaint(db, complaintId, taskId, unassignedBy) {
    const complaints = db.collection('complaints');

    const taskFilter = ObjectId.isValid(taskId)
      ? { 'tasks._id': new ObjectId(taskId) }
      : { 'tasks._id': taskId };

    // Try to update atomically, only if task exists, is not done, and has an assignee
    const result = await complaints.updateOne(
      {
        _id: new ObjectId(complaintId),
        ...taskFilter,
        'tasks.status': { $ne: 'done' },
        'tasks.assigneeId': { $ne: null }
      },
      {
        $set: {
          'tasks.$.assigneeId': null,
          'tasks.$.assigneeName': null,
          'tasks.$.assignedAt': null,
          updatedAt: new Date(),
        },
        $push: {
          history: buildHistoryEntry({
            action: 'task_unassigned',
            from: 'assigned',
            to: 'unassigned',
            by: unassignedBy,
            byName: 'Estates Officer',
            byRole: 'estates_officer',
            note: `Task ${taskId} unassigned`,
          }),
        },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  }
  ,

  // Get management queue (Phase 2)
  async getManagementQueue(
    db,
    page = 1,
    limit = 10,
    priorityFilter = 'all',
    statusFilter = 'triaged',
    categoryFilter = 'all',
    searchQuery = ''
  ) {
    const complaints = db.collection('complaints');
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }
    // When 'all' is selected, show all statuses (no status filter applied)

    // Filter by priority
    if (priorityFilter !== 'all') {
      query.priority = priorityFilter;
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      query.category = categoryFilter;
    }

    // Search across text fields
    if (searchQuery) {
      const normalizedSearch = searchQuery.trim();
      query.$or = [
        { complaintId: { $regex: normalizedSearch, $options: 'i' } },
        { title: { $regex: normalizedSearch, $options: 'i' } },
        { location: { $regex: normalizedSearch, $options: 'i' } },
        { 'user.name': { $regex: normalizedSearch, $options: 'i' } },
      ];
    }

    const total = await complaints.countDocuments(query);
    const complaintsList = await complaints
      .find(query)
      .sort({ slaDeadline: 1, priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      complaints: complaintsList,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComplaints: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // Get dashboard stats (Phase 2)
  async getDashboardStats(db, timeRange = 'all') {
    const complaints = db.collection('complaints');

    const createdAtFilter = buildCreatedAtFilter(timeRange, null, null);
    const query = createdAtFilter ? { createdAt: createdAtFilter } : {};

    const pipeline = [
      Object.keys(query).length ? { $match: query } : { $match: {} },
      {
        $facet: {
          totalComplaints: [{ $count: 'count' }],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          slaBreach: [
            {
              $match: {
                slaDeadline: { $lt: new Date() },
                status: { $nin: ['closed'] },
              },
            },
            { $count: 'count' },
          ],
          avgTimeToResolve: [
            {
              $match: { resolvedAt: { $exists: true } },
            },
            {
              $group: {
                _id: null,
                avgTime: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$resolvedAt', '$createdAt'] },
                      1000 * 60 * 60, // Convert to hours
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const result = await complaints.aggregate(pipeline).toArray();
    const stats = result[0] || {};

    // Build priority breakdown
    const priorityBreakdown = {};
    if (stats.byPriority) {
      stats.byPriority.forEach((item) => {
        priorityBreakdown[item._id || 'unset'] = item.count;
      });
    }

    // Build status breakdown
    const statusBreakdown = {};
    if (stats.byStatus) {
      stats.byStatus.forEach((item) => {
        statusBreakdown[item._id || 'unset'] = item.count;
      });
    }

    return {
      totalComplaints: stats.totalComplaints[0]?.count || 0,
      priorityBreakdown,
      statusBreakdown,
      slaBreach: stats.slaBreach[0]?.count || 0,
      avgTimeToResolveHours: stats.avgTimeToResolve[0]?.avgTime || 0,
      timestamp: new Date(),
    };
  },

  // Perform quality check (Phase 4)
  async performQualityCheck(db, complaintId, checkData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    let nextStatus = complaint.status;
    if (checkData.qualityStatus === 'PASSED') {
      nextStatus = 'ready_for_validation';
    } else if (checkData.qualityStatus === 'FAILED') {
      nextStatus = 'rework_required';
    }

    const updateFields = {
      status: nextStatus,
      'qualityCheck.checkedBy': new ObjectId(checkData.checkedBy),
      'qualityCheck.checkedAt': new Date(),
      'qualityCheck.status': checkData.qualityStatus,
      'qualityCheck.notes': checkData.checkNotes,
      'qualityCheck.photos': checkData.photos || [],
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'quality_checked',
      from: complaint.status,
      to: nextStatus,
      by: checkData.checkedBy,
      byName: 'Quality Officer',
      byRole: 'estates_officer',
      note: `Quality check: ${checkData.qualityStatus}. ${checkData.checkNotes || ''}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Schedule resident inspection (Phase 4)
  async scheduleInspection(db, complaintId, inspectionData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    const updateFields = {
      'residentValidation.scheduledFor': new Date(inspectionData.scheduledFor),
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'inspection_scheduled',
      from: complaint.status,
      to: complaint.status,
      by: inspectionData.scheduledBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Inspection scheduled for ${inspectionData.scheduledFor}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Request resident approval (Phase 4 - Officer initiates)
  async requestResidentApproval(db, complaintId, requestData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    const allTasksDone = Array.isArray(complaint.tasks) && complaint.tasks.length > 0 && complaint.tasks.every((t) => t.status === 'done');
    const isScopeDefinedReady = complaint.status === 'scope_defined' && allTasksDone;
    const isAlreadyResolved = complaint.status === 'resolved';
    const canRequestApprovalNow = isAlreadyResolved || isScopeDefinedReady;
    if (!canRequestApprovalNow) return null;

    const updateFields = {
      'residentValidation.requestedAt': new Date(),
      'residentValidation.requestedBy': new ObjectId(requestData.requestedBy),
      'residentValidation.requestedByName': requestData.requestedByName || 'Estates Officer',
      'residentValidation.requestMessage': requestData.message || 'Please review and approve the completed work.',
      'residentValidation.isPending': true,
      updatedAt: new Date(),
    };

    if (isScopeDefinedReady) {
      updateFields.status = 'resolved';
      updateFields.resolvedAt = new Date();
    } else if (isAlreadyResolved && !complaint.resolvedAt) {
      updateFields.resolvedAt = new Date();
    }

    const historyEntry = buildHistoryEntry({
      action: 'approval_requested',
      from: complaint.status,
      to: updateFields.status || complaint.status,
      by: requestData.requestedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Resident approval requested: ${requestData.message || 'Please review and approve the work.'}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Record resident approval (Phase 4 - Resident responds)
  async recordResidentApproval(db, complaintId, approvalData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    // Allow approval submission when the complaint is resolved,
    // even if a prior approval request was not explicitly created.
    if (complaint.status !== 'resolved') return null;

    let nextStatus = complaint.status;
    if (
      approvalData.approvalStatus === 'ACCEPTED' ||
      approvalData.approvalStatus === 'PARTIAL'
    ) {
      nextStatus = 'validated';
    } else if (approvalData.approvalStatus === 'REJECTED') {
      nextStatus = 'rework_required';
    }

    const updateFields = {
      status: nextStatus,
      'residentValidation.completedAt': new Date(),
      'residentValidation.approvedBy': new ObjectId(approvalData.approvedBy),
      'residentValidation.approvedByName': approvalData.approvedByName || 'Resident',
      'residentValidation.status': approvalData.approvalStatus,
      'residentValidation.feedback': approvalData.feedback || '',
      'residentValidation.satisfactionRating': approvalData.satisfactionRating || 0,
      'residentValidation.rejectionReason': approvalData.rejectionReason || null,
      'residentValidation.isPending': false,
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'resident_approval',
      from: complaint.status,
      to: nextStatus,
      by: approvalData.approvedBy,
      byName: 'Resident',
      byRole: 'resident',
      note: `${approvalData.approvalStatus}. Rating: ${approvalData.satisfactionRating}/5. ${approvalData.feedback || ''}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Request rework (Phase 5)
  async requestRework(db, complaintId, reworkData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    // Check rework count
    const reworkCount = complaint.reworkCount || 0;
    if (reworkCount >= 2) {
      // Max rework cycles reached - auto escalate
      return null;
    }

    const updateFields = {
      status: 'rework_required',
      reworkCount: reworkCount + 1,
      updatedAt: new Date(),
    };

    const reworkEntry = {
      reworkRound: reworkCount + 1,
      reason: reworkData.reworkReason,
      createdAt: new Date(),
      feedback: reworkData.reworkDetails,
      status: 'IN_PROGRESS',
    };

    const historyEntry = buildHistoryEntry({
      action: 'rework_requested',
      from: complaint.status,
      to: 'rework_required',
      by: reworkData.requestedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Rework round ${reworkCount + 1}: ${reworkData.reworkReason}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: {
          history: historyEntry,
          reworkHistory: reworkEntry,
        },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Escalate complaint (Phase 6)
  async escalateComplaint(db, complaintId, escalationData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    const updateFields = {
      'escalation.status': 'ESCALATED',
      'escalation.escalatedTo': new ObjectId(escalationData.escalateTo),
      'escalation.escalatedAt': new Date(),
      'escalation.reason': escalationData.escalationReason,
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'escalated',
      from: complaint.status,
      to: complaint.status,
      by: escalationData.escalatedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Escalated: ${escalationData.escalationReason}. ${escalationData.escalationDetails || ''}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $set: updateFields,
        $push: { history: historyEntry },
      }
    );

    if (result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Close complaint (Phase 5)
  async closeComplaint(db, complaintId, closureData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    // Diagnostic logging to help trace failures during close
    try {
      console.log('🔵 [closeComplaint] Starting close for', complaintId);
      console.log('🔵 [closeComplaint] Current status:', complaint.status);
      console.log('🔵 [closeComplaint] Incoming closureData:', JSON.stringify(closureData));
    } catch (logErr) {
      console.warn('Failed to stringify closureData for logging', logErr);
    }

    // Calculate time to resolve
    const timeToResolveMs = new Date() - complaint.createdAt;
    const timeToResolveDays = Math.ceil(timeToResolveMs / (1000 * 60 * 60 * 24));

    // Check SLA compliance
    const slaMetCompliance = !complaint.slaDeadline ||
      new Date() <= complaint.slaDeadline;

    const closedById =
      closureData.closedBy instanceof ObjectId
        ? closureData.closedBy
        : new ObjectId(closureData.closedBy);

    const closureReport = {
      summary: closureData.closureSummary || '',
      preventiveRecommendations: Array.isArray(closureData.preventiveRecommendations)
        ? closureData.preventiveRecommendations
        : [],
      costActual: Number.isFinite(Number(closureData.costActual))
        ? Number(closureData.costActual)
        : 0,
      timeToResolve: timeToResolveDays,
    };

    const metrics = {
      slaMetCompliance,
      totalHandlingTime: timeToResolveMs / (1000 * 60 * 60),
    };

    const updateFields = {
      status: 'closed',
      closedBy: closedById,
      closedAt: new Date(),
      closureReport,
      metrics,
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'closed',
      from: complaint.status,
      to: 'closed',
      by: closedById,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Closed: ${closureData.closureSummary || 'Complaint resolved'}. SLA Compliant: ${slaMetCompliance}`,
    });

    // Perform the update with explicit error capture so we log any DB-level failures
    let result;
    try {
      result = await complaints.updateOne(
        { _id: new ObjectId(complaintId) },
        {
          $set: updateFields,
          $push: { history: historyEntry },
        }
      );
    } catch (err) {
      console.error('🔴 [closeComplaint] MongoDB updateOne failed:', err && err.stack ? err.stack : err);
      throw err; // rethrow so controller/global handler records it as well
    }

    if (!result || result.modifiedCount === 0) return null;

    return await complaints.findOne({ _id: new ObjectId(complaintId) });
  },

  // Get analytics (Phase 5)
  async getAnalytics(db, timeRange = 'thismonth') {
    const complaints = db.collection('complaints');

    const createdAtFilter = buildCreatedAtFilter(timeRange, null, null);
    const query = createdAtFilter ? { createdAt: createdAtFilter } : {};

    const pipeline = [
      Object.keys(query).length ? { $match: query } : { $match: {} },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalComplaints: { $sum: 1 },
                resolvedComplaints: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'closed'] }, 1, 0],
                  },
                },
                avgSatisfaction: {
                  $avg: '$residentValidation.satisfactionRating',
                },
                avgHandlingTimeHours: {
                  $avg: {
                    $divide: [
                      {
                        $subtract: [
                          {
                            $cond: [
                              '$resolvedAt',
                              '$resolvedAt',
                              new Date(),
                            ],
                          },
                          '$createdAt',
                        ],
                      },
                      1000 * 60 * 60,
                    ],
                  },
                },
              },
            },
          ],
          priorityStats: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
                resolved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'closed'] }, 1, 0],
                  },
                },
              },
            },
          ],
          categoryStats: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                resolved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'closed'] }, 1, 0],
                  },
                },
              },
            },
          ],
          slaPerformance: [
            {
              $group: {
                _id: null,
                totalSLAComplaints: {
                  $sum: {
                    $cond: [
                      { $ne: ['$metrics.slaMetCompliance', null] },
                      1,
                      0,
                    ],
                  },
                },
                slaCompliant: {
                  $sum: {
                    $cond: ['$metrics.slaMetCompliance', 1, 0],
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const result = await complaints.aggregate(pipeline).toArray();
    const stats = result[0] || {};

    // Calculate SLA percentage
    const slaPerf = stats.slaPerformance[0] || {};
    const slaPercentage =
      slaPerf.totalSLAComplaints > 0
        ? ((slaPerf.slaCompliant / slaPerf.totalSLAComplaints) * 100).toFixed(2)
        : 0;

    return {
      summary: stats.summary[0] || {
        totalComplaints: 0,
        resolvedComplaints: 0,
        avgSatisfaction: 0,
        avgHandlingTimeHours: 0,
      },
      priorityStats: stats.priorityStats || [],
      categoryStats: stats.categoryStats || [],
      slaPercentage: parseFloat(slaPercentage),
      timeRange,
      generatedAt: new Date(),
    };
  },
};
