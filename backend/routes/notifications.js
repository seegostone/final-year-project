import express from 'express';
import { param, query } from 'express-validator';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notifications.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get(
  '/',
  [query('unread').optional().isBoolean().withMessage('Unread must be boolean')],
  getNotifications
);

router.patch(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  markNotificationRead
);

router.patch('/read-all', markAllNotificationsRead);

export default router;
