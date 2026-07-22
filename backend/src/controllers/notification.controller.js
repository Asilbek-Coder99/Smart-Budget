import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, parsePagination, sendPaginated } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getNotifications = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { unread } = req.query;

  const where = {
    userId: req.user.id,
    ...(unread === 'true' && { isRead: false }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  return sendPaginated(res, notifications, { page, limit, total }, 'Notifications fetched');
});

export const markAsRead = catchAsync(async (req, res) => {
  const notif = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!notif) throw new AppError('Notification not found', HTTP_STATUS.NOT_FOUND);

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  return sendSuccess(res, updated);
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  return sendSuccess(res, null, 'All notifications marked as read');
});

export const deleteNotification = catchAsync(async (req, res) => {
  const notif = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!notif) throw new AppError('Notification not found', HTTP_STATUS.NOT_FOUND);

  await prisma.notification.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'Notification deleted');
});

export const deleteAllNotifications = catchAsync(async (req, res) => {
  await prisma.notification.deleteMany({ where: { userId: req.user.id } });
  return sendSuccess(res, null, 'All notifications deleted');
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  return sendSuccess(res, { count });
});
