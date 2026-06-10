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

// Management operations (for Estates Officer/Admin features)
export const managementOperations = {
  // Validate complaint (Phase 1)
  async validateComplaint(db, complaintId, validationData) {
    const complaints = db.collection('complaints');

    // Query by MongoDB _id (ObjectId), consistent with your existing pattern
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

  // Triage complaint (Phase 1)
  async triageComplaint(db, complaintId, triageData) {
    const complaints = db.collection('complaints');

    // Query by MongoDB _id (ObjectId)
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    // Calculate SLA deadline based on priority
    const slaTiers = {
      CRITICAL: 1,    // 1 day
      HIGH: 2,        // 2 days
      MEDIUM: 5,      // 5 days
      LOW: 10,        // 10 days
    };

    const slaDays = slaTiers[triageData.priority] || 5;
    const slaDeadline = new Date(
      Date.now() + slaDays * 24 * 60 * 60 * 1000
    );

    const updateFields = {
      status: 'triaged',
      priority: triageData.priority,
      slaDeadline,
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'triaged',
      from: complaint.status,
      to: 'triaged',
      by: triageData.triageBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Priority: ${triageData.priority}. ${triageData.triageNotes || ''}`,
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

    // Query by MongoDB _id (ObjectId)
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    const updateFields = {
      status: 'scope_defined',
      'scopeDefinition.description': scopeData.scopeDescription,
      'scopeDefinition.estimatedDuration': scopeData.estimatedDuration || 2,
      'scopeDefinition.requiredSkills': scopeData.requiredSkills || [],
      'scopeDefinition.estimatedCost': scopeData.estimatedCost || 0,
      'scopeDefinition.dependencies': scopeData.dependencies?.map(
        (id) => new ObjectId(id)
      ) || [],
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'scope_defined',
      from: complaint.status,
      to: 'scope_defined',
      by: scopeData.definedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Scope: ${scopeData.scopeDescription}`,
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

  // Assign complaint to technician (Phase 2)
  async assignComplaint(db, complaintId, assignmentData) {
    const complaints = db.collection('complaints');

    // Query by MongoDB _id (ObjectId)
    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    // Validate that complaint is ready for assignment
    if (!['scope_defined', 'triaged'].includes(complaint.status)) {
      return null;
    }

    const updateFields = {
      status: 'assigned',
      'assignment.technicianId': new ObjectId(assignmentData.technicianId),
      'assignment.technicianName': assignmentData.technicianName,
      'assignment.assignedBy': assignmentData.assignedBy,
      'assignment.assignedAt': new Date(),
      'assignment.confirmed': false,
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'assigned',
      from: complaint.status,
      to: 'assigned',
      by: assignmentData.assignedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Assigned to: ${assignmentData.technicianName || 'Technician'}`,
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

  // Add a task to a complaint
  async addTaskToComplaint(db, complaintId, taskData, createdBy) {
    const complaints = db.collection('complaints');
    const complaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    if (!complaint) return null;

    const task = {
      _id: new ObjectId(),
      title: taskData.title || taskData.text || 'Task',
      description: taskData.description || '',
      status: 'open', // open, in_progress, done
      createdBy: new ObjectId(createdBy),
      createdAt: new Date(),
      assigneeId: taskData.assigneeId ? new ObjectId(taskData.assigneeId) : null,
      assigneeName: taskData.assigneeName || null,
      assignedAt: taskData.assigneeId ? new Date() : null,
      notes: taskData.notes || null,
    };

    const historyEntry = buildHistoryEntry({
      action: 'task_created',
      from: complaint.status,
      to: complaint.status,
      by: createdBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Task created: ${task.title}`,
    });

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId) },
      {
        $push: { tasks: task, history: historyEntry },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) return null;

    // Return the created task (with _id)
    return task;
  },

  // Assign a technician to a specific task inside a complaint
  async assignTaskToComplaint(db, complaintId, taskId, assigneeData, assignedBy) {
    const complaints = db.collection('complaints');
    const complaint = await complaints.findOne({ _id: new ObjectId(complaintId) });
    if (!complaint) return null;

    const result = await complaints.updateOne(
      { _id: new ObjectId(complaintId), 'tasks._id': new ObjectId(taskId) },
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

  // Get management queue (Phase 2)
  async getManagementQueue(
    db,
    page = 1,
    limit = 10,
    priorityFilter = 'all',
    statusFilter = 'triaged'
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

  // Record resident approval (Phase 4)
  async recordResidentApproval(db, complaintId, approvalData) {
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({
      _id: new ObjectId(complaintId),
    });
    if (!complaint) return null;

    let nextStatus = complaint.status;
    if (approvalData.approvalStatus === 'ACCEPTED') {
      nextStatus = 'validated';
    } else if (approvalData.approvalStatus === 'REJECTED') {
      nextStatus = 'rework_required';
    }

    const updateFields = {
      status: nextStatus,
      'residentValidation.completedAt': new Date(),
      'residentValidation.approvedBy': new ObjectId(approvalData.approvedBy),
      'residentValidation.status': approvalData.approvalStatus,
      'residentValidation.feedback': approvalData.feedback || '',
      'residentValidation.satisfactionRating': approvalData.satisfactionRating || 0,
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

    // Calculate time to resolve
    const timeToResolveMs = new Date() - complaint.createdAt;
    const timeToResolveDays = timeToResolveMs / (1000 * 60 * 60 * 24);

    // Check SLA compliance
    const slaMetCompliance = !complaint.slaDeadline ||
      new Date() <= complaint.slaDeadline;

    const updateFields = {
      status: 'closed',
      closedBy: new ObjectId(closureData.closedBy),
      closedAt: new Date(),
      'closureReport.summary': closureData.closureSummary || '',
      'closureReport.preventiveRecommendations':
        closureData.preventiveRecommendations || [],
      'closureReport.costActual': closureData.costActual || 0,
      'closureReport.timeToResolve': timeToResolveDays,
      'metrics.slaMetCompliance': slaMetCompliance,
      'metrics.totalHandlingTime': timeToResolveMs / (1000 * 60 * 60),
      updatedAt: new Date(),
    };

    const historyEntry = buildHistoryEntry({
      action: 'closed',
      from: complaint.status,
      to: 'closed',
      by: closureData.closedBy,
      byName: 'Estates Officer',
      byRole: 'estates_officer',
      note: `Closed: ${closureData.closureSummary || 'Complaint resolved'}. SLA Compliant: ${slaMetCompliance}`,
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
