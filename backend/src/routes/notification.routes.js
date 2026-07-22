import { Router } from 'express';
import {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, deleteAllNotifications, getUnreadCount,
} from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.delete('/', deleteAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
