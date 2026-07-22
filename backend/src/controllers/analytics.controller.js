import prisma from '../config/database.js';
import { catchAsync } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ============================================
// OVERVIEW ANALYTICS
// ============================================
export const getOverview = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const { months = 6 } = req.query;
  const monthCount = Math.min(12, Math.max(1, parseInt(months)));

  // Build last N months array
  const periods = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  // Fetch monthly income/expense for each period
  const monthlyData = await Promise.all(
    periods.map(async ({ month, year }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      return {
        month,
        year,
        label: new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: Number(inc._sum.amount || 0),
        expense: Number(exp._sum.amount || 0),
        savings: Number(inc._sum.amount || 0) - Number(exp._sum.amount || 0),
      };
    })
  );

  // Expense breakdown by category (current month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenseByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
    _count: true,
  });

  const catIds = expenseByCategory.map((e) => e.categoryId);
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true, icon: true, color: true },
  });
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

  const totalExpenseThisMonth = expenseByCategory.reduce((s, e) => s + Number(e._sum.amount), 0);

  return sendSuccess(res, {
    monthlyTrend: monthlyData,
    currentMonthExpenseByCategory: expenseByCategory.map((e) => ({
      category: catMap[e.categoryId] || { id: e.categoryId, name: 'Unknown' },
      amount: Number(e._sum.amount),
      count: e._count,
      percentage: totalExpenseThisMonth > 0
        ? Math.round((Number(e._sum.amount) / totalExpenseThisMonth) * 100)
        : 0,
    })),
  });
});

// ============================================
// SPENDING INSIGHTS
// ============================================
export const getInsights = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [currInc, currExp, prevInc, prevExp, topExpenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', date: { gte: currentMonthStart, lte: currentMonthEnd } },
      orderBy: { amount: 'desc' },
      take: 5,
      include: { category: { select: { name: true, icon: true, color: true } } },
    }),
  ]);

  const currIncAmt = Number(currInc._sum.amount || 0);
  const currExpAmt = Number(currExp._sum.amount || 0);
  const prevIncAmt = Number(prevInc._sum.amount || 0);
  const prevExpAmt = Number(prevExp._sum.amount || 0);

  const incomeChange = prevIncAmt > 0 ? ((currIncAmt - prevIncAmt) / prevIncAmt) * 100 : 0;
  const expenseChange = prevExpAmt > 0 ? ((currExpAmt - prevExpAmt) / prevExpAmt) * 100 : 0;
  const savingsRate = currIncAmt > 0 ? ((currIncAmt - currExpAmt) / currIncAmt) * 100 : 0;

  return sendSuccess(res, {
    currentMonth: {
      income: currIncAmt,
      expense: currExpAmt,
      savings: currIncAmt - currExpAmt,
      savingsRate: Math.round(savingsRate),
    },
    previousMonth: {
      income: prevIncAmt,
      expense: prevExpAmt,
      savings: prevIncAmt - prevExpAmt,
    },
    changes: {
      income: Math.round(incomeChange * 10) / 10,
      expense: Math.round(expenseChange * 10) / 10,
    },
    topExpenses: topExpenses.map((t) => ({ ...t, amount: Number(t.amount) })),
  });
});
