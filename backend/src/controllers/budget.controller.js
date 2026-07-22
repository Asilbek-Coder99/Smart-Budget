import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

// ============================================
// GET BUDGETS (by month/year)
// ============================================
export const getBudgets = catchAsync(async (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { userId: req.user.id, month, year },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = budgets.map((b) => {
    const amount = Number(b.amount);
    const spent = Number(b.spent);
    const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    const remaining = Math.max(0, amount - spent);
    return { ...b, amount, spent, percentage, remaining };
  });

  // Calculate totals
  const totalBudget = formatted.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = formatted.reduce((sum, b) => sum + b.spent, 0);

  return sendSuccess(res, {
    budgets: formatted,
    summary: {
      totalBudget,
      totalSpent,
      totalRemaining: Math.max(0, totalBudget - totalSpent),
      overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    },
  });
});

// ============================================
// GET SINGLE BUDGET
// ============================================
export const getBudget = catchAsync(async (req, res) => {
  const budget = await prisma.budget.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  if (!budget) throw new AppError('Budget not found', HTTP_STATUS.NOT_FOUND);

  const amount = Number(budget.amount);
  const spent = Number(budget.spent);
  return sendSuccess(res, {
    ...budget,
    amount,
    spent,
    percentage: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    remaining: Math.max(0, amount - spent),
  });
});

// ============================================
// CREATE BUDGET
// ============================================
export const createBudget = catchAsync(async (req, res) => {
  const { name, amount, categoryId, month, year, alertAt } = req.body;

  // Validate category
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      type: 'EXPENSE',
      OR: [{ userId: null }, { userId: req.user.id }],
    },
  });
  if (!category) {
    throw new AppError('Expense category not found', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if budget already exists for this category/month/year
  const existing = await prisma.budget.findUnique({
    where: {
      userId_categoryId_month_year: { userId: req.user.id, categoryId, month, year },
    },
  });
  if (existing) {
    throw new AppError('A budget for this category in this month already exists', HTTP_STATUS.CONFLICT);
  }

  // Calculate already-spent amount for this period
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const spentResult = await prisma.transaction.aggregate({
    where: { userId: req.user.id, categoryId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
    _sum: { amount: true },
  });
  const spent = Number(spentResult._sum.amount || 0);

  const budget = await prisma.budget.create({
    data: { name, amount, categoryId, month, year, alertAt: alertAt || 80, spent, userId: req.user.id },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  const amtNum = Number(budget.amount);
  const spentNum = Number(budget.spent);
  return sendCreated(res, {
    ...budget,
    amount: amtNum,
    spent: spentNum,
    percentage: amtNum > 0 ? Math.round((spentNum / amtNum) * 100) : 0,
    remaining: Math.max(0, amtNum - spentNum),
  }, 'Budget created');
});

// ============================================
// UPDATE BUDGET
// ============================================
export const updateBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, amount, alertAt } = req.body;

  const budget = await prisma.budget.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!budget) throw new AppError('Budget not found', HTTP_STATUS.NOT_FOUND);

  const updated = await prisma.budget.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(amount !== undefined && { amount }),
      ...(alertAt !== undefined && { alertAt }),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  const amtNum = Number(updated.amount);
  const spentNum = Number(updated.spent);
  return sendSuccess(res, {
    ...updated,
    amount: amtNum,
    spent: spentNum,
    percentage: amtNum > 0 ? Math.round((spentNum / amtNum) * 100) : 0,
    remaining: Math.max(0, amtNum - spentNum),
  }, 'Budget updated');
});

// ============================================
// DELETE BUDGET
// ============================================
export const deleteBudget = catchAsync(async (req, res) => {
  const budget = await prisma.budget.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!budget) throw new AppError('Budget not found', HTTP_STATUS.NOT_FOUND);

  await prisma.budget.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'Budget deleted');
});
