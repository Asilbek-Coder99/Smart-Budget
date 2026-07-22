import prisma from '../config/database.js';
import { catchAsync } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as XLSX from 'xlsx';

// ============================================
// GET REPORTS
// ============================================
export const getReports = catchAsync(async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return sendSuccess(res, reports);
});

// ============================================
// EXPORT CSV
// ============================================
export const exportCSV = catchAsync(async (req, res) => {
  const { startDate, endDate, type } = req.query;

  const where = {
    userId: req.user.id,
    ...(type && { type }),
    ...(startDate || endDate
      ? { date: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { category: { select: { name: true } } },
  });

  const rows = transactions.map((t) => ({
    Date: new Date(t.date).toLocaleDateString(),
    Title: t.title,
    Type: t.type,
    Category: t.category.name,
    Amount: Number(t.amount),
    Description: t.description || '',
    Note: t.note || '',
  }));

  const csv = [
    Object.keys(rows[0] || {}).join(','),
    ...rows.map((row) =>
      Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.csv"`);
  res.send(csv);
});

// ============================================
// EXPORT EXCEL
// ============================================
export const exportExcel = catchAsync(async (req, res) => {
  const { startDate, endDate, type } = req.query;

  const where = {
    userId: req.user.id,
    ...(type && { type }),
    ...(startDate || endDate
      ? { date: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { category: { select: { name: true } } },
  });

  const rows = transactions.map((t) => ({
    Date: new Date(t.date).toLocaleDateString(),
    Title: t.title,
    Type: t.type,
    Category: t.category.name,
    Amount: Number(t.amount),
    Description: t.description || '',
    Note: t.note || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.xlsx"`);
  res.send(buffer);
});

// ============================================
// GET REPORT SUMMARY
// ============================================
export const getReportSummary = catchAsync(async (req, res) => {
  const { period = 'MONTHLY', year, month } = req.query;
  const now = new Date();
  const y = parseInt(year) || now.getFullYear();
  const m = parseInt(month) || now.getMonth() + 1;

  let startDate, endDate;

  if (period === 'MONTHLY') {
    startDate = new Date(y, m - 1, 1);
    endDate = new Date(y, m, 0, 23, 59, 59);
  } else if (period === 'YEARLY') {
    startDate = new Date(y, 0, 1);
    endDate = new Date(y, 11, 31, 23, 59, 59);
  } else if (period === 'WEEKLY') {
    const day = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59);
  } else {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59);
  }

  const [income, expense, count] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: req.user.id, type: 'INCOME', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: req.user.id, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
    }),
  ]);

  const totalIncome = Number(income._sum.amount || 0);
  const totalExpense = Number(expense._sum.amount || 0);

  return sendSuccess(res, {
    period,
    startDate,
    endDate,
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    transactionCount: count,
    savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
  });
});
