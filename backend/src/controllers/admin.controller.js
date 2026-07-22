import prisma from '../config/database.js';
import { catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getStats = catchAsync(async (req, res) => {
  const [userCount, transactionCount, totalIncome, totalExpense] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'EXPENSE' }, _sum: { amount: true } }),
  ]);

  return sendSuccess(res, {
    userCount,
    transactionCount,
    totalIncome: Number(totalIncome._sum.amount || 0),
    totalExpense: Number(totalExpense._sum.amount || 0),
  });
});

export const getUsers = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search } = req.query;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, username: true, firstName: true,
        lastName: true, role: true, isActive: true, createdAt: true,
        _count: { select: { transactions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return sendPaginated(res, users, { page, limit, total });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, email: true, username: true, firstName: true,
      lastName: true, role: true, isActive: true, currency: true, createdAt: true,
      _count: { select: { transactions: true, categories: true, budgets: true, savingsGoals: true } },
    },
  });
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, user);
});

export const toggleUserStatus = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  if (user.id === req.user.id) throw new AppError('Cannot deactivate your own account', HTTP_STATUS.BAD_REQUEST);

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true, email: true },
  });
  return sendSuccess(res, updated, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  if (user.id === req.user.id) throw new AppError('Cannot delete your own account', HTTP_STATUS.BAD_REQUEST);

  await prisma.user.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'User deleted successfully');
});
