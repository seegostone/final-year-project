import { validationResult } from 'express-validator';
import { userOperations, passwordUtils, jwtUtils } from '../utils/database.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for frontend consumption
    const formattedErrors = {};
    errors.array().forEach((err) => {
      const fieldMap = {
        name: 'fullName',
        email: 'email',
        password: 'password',
        role: 'role',
        phoneNumber: 'phoneNumber',
      };
      const field = fieldMap[err.path] || err.path;
      if (!formattedErrors[field]) {
        formattedErrors[field] = err.msg;
      }
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      code: 'VALIDATION_ERROR',
    });
  }

  const { name, email, password, role, phoneNumber, specialization, zone, skills } = req.body;
  const db = req.app.locals.db;

  const normalizedSkills = Array.isArray(skills)
    ? skills.map((skill) => skill.trim()).filter(Boolean)
    : typeof skills === 'string'
    ? skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    : [];

  try {
    // Check if user already exists
    const existingUser = await userOperations.findByEmail(db, email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        code: 'USER_EXISTS',
      });
    }

    // Hash password
    const hashedPassword = await passwordUtils.hashPassword(password);

    // Create user
    const user = await userOperations.createUser(db, {
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      phoneNumber,
      specialization,
      zone,
      skills: normalizedSkills,
      isActive: true,
      emailVerified: false,
    });

    // Generate email verification token
    const verificationToken = await userOperations.setEmailVerificationToken(
      db,
      email
    );
    console.log('Generated email verification token:', verificationToken); // Debug log

    // Send verification email (implement this)
    // await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        // Only include token in development
        ...(process.env.NODE_ENV !== 'production' && { verificationToken }),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      code: 'SERVER_ERROR',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;
  const db = req.app.locals.db;

  try {
    // Check for user
    const user = await userOperations.findByEmail(db, email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await passwordUtils.comparePassword(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    // Generate token
    const token = jwtUtils.generateToken({ id: user._id });

    // Update last login
    await userOperations.updateLastLogin(db, user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
    data: {},
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await userOperations.findById(db, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;
  const db = req.app.locals.db;

  try {
    const user = await userOperations.findById(db, req.user._id);

    // Check current password
    if (
      !(await passwordUtils.comparePassword(currentPassword, user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await passwordUtils.hashPassword(newPassword);

    await userOperations.updateUser(db, req.user._id, {
      password: hashedPassword,
    });

    const token = jwtUtils.generateToken({ id: user._id });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email } = req.body;
  const db = req.app.locals.db;

  try {
    const user = await userOperations.findByEmail(db, email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get reset token
    const resetToken = await userOperations.setResetPasswordToken(db, email);

    // In a real application, you would send an email here
    // For now, we'll just return the token for testing purposes
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken, // Remove this in production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { password } = req.body;
  const db = req.app.locals.db;

  try {
    const user = await userOperations.resetPassword(
      db,
      req.params.resettoken,
      password
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const token = jwtUtils.generateToken({ id: user._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:verificationtoken
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await userOperations.verifyEmail(
      db,
      req.params.verificationtoken
    );
    console.log('User after email verification:', user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Generate token after successful email verification
    const token = jwtUtils.generateToken({ id: user._id });

    // Update last login
    await userOperations.updateLastLogin(db, user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You are now logged in.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        lastUpdatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const db = req.app.locals.db;

  try {
    const user = await userOperations.findByEmail(db, email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    const verificationToken = await userOperations.setEmailVerificationToken(
      db,
      email
    );
    // In a real application, send email with verificationToken
    // For now, just return the token in response (for testing)

    console.log('Generated email verification token:', verificationToken); // Debug log

    // Get the updated user to get the expiry time
    const updatedUser = await userOperations.findByEmail(db, email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      expiresAt: updatedUser.emailVerificationExpire, // ← Add this line
      verificationToken, // Remove this in production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
