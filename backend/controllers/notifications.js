import { validationResult } from 'express-validator';
import { userOperations } from '../utils/database.js';

export const getNotifications = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;
    const unreadOnly = req.query.unread === 'true';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      userOperations.getNotifications(db, userId, {
        unreadOnly,
        limit,
        skip,
      }),
      userOperations.getUnreadNotificationsCount(db, userId),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
    });
  }
};

export const markNotificationRead = async (req, res) => {
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
    const notificationId = req.params.id;

    const success = await userOperations.markNotificationRead(
      db,
      userId,
      notificationId
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked read',
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking notification read',
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id;

    const success = await userOperations.markAllNotificationsRead(db, userId);
    if (!success) {
      return res.status(200).json({
        success: true,
        message: 'No unread notifications to mark as read',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All notifications marked read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking notifications read',
    });
  }
};
