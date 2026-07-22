import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendCreated, sendPaginated, parsePagination, parseSort } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

// Helper: update budget spent when a transaction changes
async function updateBudgetSpent(userId, categoryId, month, year) {
  const budget = await prisma.budget.findUnique({
    where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
  });
  if (!budget) return;

  const totalSpent = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: 'EXPENSE',
      date: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      },
    },
    _sum: { amount: true },
  });

  const spent = Number(totalSpent._sum.amount || 0);
  await prisma.budget.update({
    where: { id: budget.id },
    data: { spent },
  });

  // Create notification if threshold hit
  const percentage = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0;
  if (percentage >= 100) {
    await prisma.notification.upsert({
      where: { id: `budget-exceeded-${budget.id}-${month}-${year}` },
      create: {
        id: `budget-exceeded-${budget.id}-${month}-${year}`,
        title: 'Budget Exceeded! 🚨',
        message: `You have exceeded your budget for ${budget.name}.`,
        type: 'BUDGET_EXCEEDED',
        userId,
        data: { budgetId: budget.id, spent, limit: Number(budget.amount) },
      },
      update: {},
    }).catch(() => {}); // silently ignore duplicate
  } else if (percentage >= budget.alertAt) {
    await prisma.notification.create({
      data: {
        title: 'Budget Warning ⚠️',
        message: `You have used ${Math.round(percentage)}% of your ${budget.name} budget.`,
        type: 'BUDGET_WARNING',
        userId,
        data: { budgetId: budget.id, percentage: Math.round(percentage) },
      },
    }).catch(() => {});
  }
}

// ============================================
// GET ALL TRANSACTIONS (paginated + filtered)
// ============================================
export const getTransactions = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const {
    type,
    categoryId,
    search,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  } = req.query;

  const where = {
    userId: req.user.id,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
    ...(minAmount || maxAmount
      ? {
          amount: {
            ...(minAmount && { gte: parseFloat(minAmount) }),
            ...(maxAmount && { lte: parseFloat(maxAmount) }),
          },
        }
      : {}),
  };

  const allowedSortFields = ['date', 'amount', 'title', 'createdAt'];
  const orderBy = parseSort(req.query, allowedSortFields, 'date');

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const formatted = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));

  return sendPaginated(res, formatted, { page, limit, total });
});

// ============================================
// GET SINGLE TRANSACTION
// ============================================
export const getTransaction = catchAsync(async (req, res) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', HTTP_STATUS.NOT_FOUND);
  }

  return sendSuccess(res, { ...transaction, amount: Number(transaction.amount) });
});

// ============================================
// CREATE TRANSACTION
// ============================================
export const createTransaction = catchAsync(async (req, res) => {
  const { title, amount, type, categoryId, date, description, note } = req.body;

  // Validate category ownership
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      type,
      OR: [{ userId: null }, { userId: req.user.id }],
    },
  });
  if (!category) {
    throw new AppError('Category not found or type mismatch', HTTP_STATUS.BAD_REQUEST);
  }

  const txDate = date ? new Date(date) : new Date();

  const transaction = await prisma.transaction.create({
    data: {
      title,
      amount,
      type,
      categoryId,
      date: txDate,
      description,
      note,
      userId: req.user.id,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  // Update budget if it's an expense
  if (type === 'EXPENSE') {
    await updateBudgetSpent(
      req.user.id,
      categoryId,
      txDate.getMonth() + 1,
      txDate.getFullYear()
    );
  }

  return sendCreated(res, { ...transaction, amount: Number(transaction.amount) }, 'Transaction created');
});

// ============================================
// UPDATE TRANSACTION
// ============================================
export const updateTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, amount, categoryId, date, description, note } = req.body;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) {
    throw new AppError('Transaction not found', HTTP_STATUS.NOT_FOUND);
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: existing.type,
        OR: [{ userId: null }, { userId: req.user.id }],
      },
    });
    if (!category) throw new AppError('Category not found or type mismatch', HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(amount !== undefined && { amount }),
      ...(categoryId && { categoryId }),
      ...(date && { date: new Date(date) }),
      ...(description !== undefined && { description }),
      ...(note !== undefined && { note }),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  // Re-sync budget
  const txDate = new Date(updated.date);
  if (updated.type === 'EXPENSE') {
    await updateBudgetSpent(
      req.user.id,
      updated.categoryId,
      txDate.getMonth() + 1,
      txDate.getFullYear()
    );
  }

  return sendSuccess(res, { ...updated, amount: Number(updated.amount) }, 'Transaction updated');
});

// ============================================
// DELETE TRANSACTION
// ============================================
export const deleteTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) {
    throw new AppError('Transaction not found', HTTP_STATUS.NOT_FOUND);
  }

  await prisma.transaction.delete({ where: { id } });

  // Re-sync budget
  const txDate = new Date(existing.date);
  if (existing.type === 'EXPENSE') {
    await updateBudgetSpent(
      req.user.id,
      existing.categoryId,
      txDate.getMonth() + 1,
      txDate.getFullYear()
    );
  }

  return sendSuccess(res, null, 'Transaction deleted');
});

// ============================================
// GET MONTHLY SUMMARY
// ============================================
export const getMonthlySummary = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const [income, expense, byCategory] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: req.user.id, type: 'INCOME', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { userId: req.user.id, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: req.user.id, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  // Enrich category data
  const categoryIds = byCategory.map((b) => b.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true, color: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const totalIncome = Number(income._sum.amount || 0);
  const totalExpense = Number(expense._sum.amount || 0);

  return sendSuccess(res, {
    month: m,
    year: y,
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    incomeTransactions: income._count,
    expenseTransactions: expense._count,
    expenseByCategory: byCategory.map((b) => ({
      category: catMap[b.categoryId] || { id: b.categoryId, name: 'Unknown' },
      total: Number(b._sum.amount),
      count: b._count,
      percentage: totalExpense > 0 ? Math.round((Number(b._sum.amount) / totalExpense) * 100) : 0,
    })),
  });
});
