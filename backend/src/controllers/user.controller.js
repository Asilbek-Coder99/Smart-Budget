import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

// ============================================
// GET MY PROFILE
// ============================================
export const getProfile = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      currency: true,
      timezone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return sendSuccess(res, user);
});

// ============================================
// UPDATE PROFILE
// ============================================
export const updateProfile = catchAsync(async (req, res) => {
  const { firstName, lastName, username, currency, timezone } = req.body;

  // Check username uniqueness if being changed
  if (username && username !== req.user.username) {
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: req.user.id } },
    });
    if (taken) {
      throw new AppError('Username is already taken', HTTP_STATUS.CONFLICT);
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(username && { username }),
      ...(currency && { currency: currency.toUpperCase() }),
      ...(timezone && { timezone }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      currency: true,
      timezone: true,
      updatedAt: true,
    },
  });

  return sendSuccess(res, updated, 'Profile updated successfully');
});

// ============================================
// UPLOAD AVATAR
// ============================================
export const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file', HTTP_STATUS.BAD_REQUEST);
  }

  // Delete old avatar if it exists and is not a URL
  const current = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatar: true },
  });

  if (current?.avatar && current.avatar.startsWith('/uploads/')) {
    const oldPath = path.join(process.cwd(), current.avatar);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: avatarUrl },
    select: { id: true, avatar: true },
  });

  return sendSuccess(res, updated, 'Avatar uploaded successfully');
});

// ============================================
// DELETE AVATAR
// ============================================
export const deleteAvatar = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatar: true },
  });

  if (user?.avatar && user.avatar.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), user.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: null },
  });

  return sendSuccess(res, null, 'Avatar removed successfully');
});

// ============================================
// GET USER DASHBOARD STATS
// ============================================
export const getDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalIncome,
    totalExpense,
    monthlyIncome,
    monthlyExpense,
    transactionCount,
    budgets,
    savingsGoals,
    recentTransactions,
  ] = await Promise.all([
    // All-time totals
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    }),

    // This month
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),

    // Count
    prisma.transaction.count({ where: { userId } }),

    // Active budgets
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { category: { select: { name: true, icon: true, color: true } } },
    }),

    // Active savings goals
    prisma.savingsGoal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Recent transactions
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { category: { select: { name: true, icon: true, color: true } } },
    }),
  ]);

  const totalIncomeAmt = Number(totalIncome._sum.amount || 0);
  const totalExpenseAmt = Number(totalExpense._sum.amount || 0);
  const monthlyIncomeAmt = Number(monthlyIncome._sum.amount || 0);
  const monthlyExpenseAmt = Number(monthlyExpense._sum.amount || 0);

  return sendSuccess(res, {
    balance: totalIncomeAmt - totalExpenseAmt,
    totalIncome: totalIncomeAmt,
    totalExpense: totalExpenseAmt,
    monthlyIncome: monthlyIncomeAmt,
    monthlyExpense: monthlyExpenseAmt,
    monthlySavings: monthlyIncomeAmt - monthlyExpenseAmt,
    transactionCount,
    budgets: budgets.map((b) => ({
      ...b,
      amount: Number(b.amount),
      spent: Number(b.spent),
      percentage: b.amount > 0 ? Math.round((Number(b.spent) / Number(b.amount)) * 100) : 0,
    })),
    savingsGoals: savingsGoals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      percentage:
        g.targetAmount > 0
          ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
          : 0,
    })),
    recentTransactions: recentTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
  });
});
