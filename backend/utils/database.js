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

// Atomic sequence helper for generating unique sequential IDs
async function getNextSequence(db, name) {
  const counters = db.collection('counters');
  const res = await counters.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  const counter = res?.value || (await counters.findOne({ _id: name }));
  if (!counter) {
    const insertRes = await counters.insertOne({ _id: name, seq: 1 });
    if (!insertRes.acknowledged) {
      throw new Error(`Failed to initialize counter for ${name}`);
    }
    return 1;
  }

  if (typeof counter.seq !== 'number') {
    throw new Error(`Counter value for ${name} is invalid`);
  }

  return counter.seq;
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
  return {
    action,
    from,
    to,
    by: new ObjectId(by),
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

    const user = {
      ...userData,
      _id: new ObjectId(),
      role: normalizeRole(userData.role) || 'user',
      isActive: true,
      lastLogin: null,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      emailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpire: null,
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
      status: 'pending', // pending, assigned, in-progress, resolved
      attachments,
      hasAttachment: attachments.length > 0,
      imageData: complaintData.imageData || null,
      assignedTo: null,
      assignedAt: null,
      resolvedAt: null,
      resolutionNotes: null,
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
