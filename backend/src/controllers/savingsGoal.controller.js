import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const getSavingsGoals = catchAsync(async (req, res) => {
  const { status } = req.query;
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: req.user.id, ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
  });
  const formatted = goals.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    percentage: Number(g.targetAmount) > 0
      ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
      : 0,
  }));
  return sendSuccess(res, formatted);
});

export const getSavingsGoal = catchAsync(async (req, res) => {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!goal) throw new AppError('Savings goal not found', HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    percentage: Number(goal.targetAmount) > 0
      ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
      : 0,
  });
});

export const createSavingsGoal = catchAsync(async (req, res) => {
  const { name, description, targetAmount, deadline, icon, color } = req.body;
  const goal = await prisma.savingsGoal.create({
    data: {
      name, description, targetAmount,
      deadline: deadline ? new Date(deadline) : null,
      icon: icon || '🎯',
      color: color || '#10b981',
      userId: req.user.id,
    },
  });
  return sendCreated(res, {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    percentage: 0,
  }, 'Savings goal created');
});

export const updateSavingsGoal = catchAsync(async (req, res) => {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!goal) throw new AppError('Savings goal not found', HTTP_STATUS.NOT_FOUND);

  const { name, description, targetAmount, currentAmount, deadline, icon, color, status } = req.body;

  const updated = await prisma.savingsGoal.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(targetAmount !== undefined && { targetAmount }),
      ...(currentAmount !== undefined && { currentAmount }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(icon && { icon }),
      ...(color && { color }),
      ...(status && { status }),
    },
  });

  // Auto-complete if target reached
  const target = Number(updated.targetAmount);
  const current = Number(updated.currentAmount);
  if (current >= target && updated.status === 'ACTIVE') {
    await prisma.savingsGoal.update({ where: { id: updated.id }, data: { status: 'COMPLETED' } });
    await prisma.notification.create({
      data: {
        title: '🎉 Savings Goal Achieved!',
        message: `Congratulations! You have reached your "${updated.name}" savings goal!`,
        type: 'GOAL_ACHIEVED',
        userId: req.user.id,
      },
    }).catch(() => {});
    updated.status = 'COMPLETED';
  }

  return sendSuccess(res, {
    ...updated,
    targetAmount: Number(updated.targetAmount),
    currentAmount: Number(updated.currentAmount),
    percentage: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
  }, 'Goal updated');
});

export const deleteSavingsGoal = catchAsync(async (req, res) => {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!goal) throw new AppError('Savings goal not found', HTTP_STATUS.NOT_FOUND);
  await prisma.savingsGoal.delete({ where: { id: req.params.id } });
  return sendSuccess(res, null, 'Savings goal deleted');
});

export const addContribution = catchAsync(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) throw new AppError('Amount must be positive', HTTP_STATUS.BAD_REQUEST);

  const goal = await prisma.savingsGoal.findFirst({
    where: { id: req.params.id, userId: req.user.id, status: 'ACTIVE' },
  });
  if (!goal) throw new AppError('Active savings goal not found', HTTP_STATUS.NOT_FOUND);

  const newAmount = Number(goal.currentAmount) + Number(amount);
  const target = Number(goal.targetAmount);
  const isComplete = newAmount >= target;

  const updated = await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: {
      currentAmount: newAmount,
      ...(isComplete && { status: 'COMPLETED' }),
    },
  });

  if (isComplete) {
    await prisma.notification.create({
      data: {
        title: '🎉 Savings Goal Achieved!',
        message: `You reached your "${goal.name}" goal!`,
        type: 'GOAL_ACHIEVED',
        userId: req.user.id,
      },
    }).catch(() => {});
  }

  return sendSuccess(res, {
    ...updated,
    targetAmount: Number(updated.targetAmount),
    currentAmount: Number(updated.currentAmount),
    percentage: target > 0 ? Math.min(100, Math.round((Number(updated.currentAmount) / target) * 100)) : 0,
  }, 'Contribution added');
});
