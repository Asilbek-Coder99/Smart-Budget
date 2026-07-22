import prisma from '../config/database.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

// ============================================
// GET ALL CATEGORIES (default + user's own)
// ============================================
export const getCategories = catchAsync(async (req, res) => {
  const { type } = req.query;

  const where = {
    OR: [
      { userId: null, isDefault: true },  // global defaults
      { userId: req.user.id },             // user's custom categories
    ],
    ...(type && { type }),
  };

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { transactions: true } },
    },
  });

  return sendSuccess(res, categories);
});

// ============================================
// GET SINGLE CATEGORY
// ============================================
export const getCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findFirst({
    where: {
      id,
      OR: [{ userId: null, isDefault: true }, { userId: req.user.id }],
    },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  if (!category) {
    throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
  }

  return sendSuccess(res, category);
});

// ============================================
// CREATE CATEGORY
// ============================================
export const createCategory = catchAsync(async (req, res) => {
  const { name, type, icon, color, description } = req.body;

  // Check duplicate name for this user
  const existing = await prisma.category.findFirst({
    where: { name, type, userId: req.user.id },
  });
  if (existing) {
    throw new AppError('You already have a category with this name and type', HTTP_STATUS.CONFLICT);
  }

  const category = await prisma.category.create({
    data: {
      name,
      type,
      icon: icon || '💰',
      color: color || '#6366f1',
      description,
      userId: req.user.id,
      isDefault: false,
    },
  });

  return sendCreated(res, category, 'Category created successfully');
});

// ============================================
// UPDATE CATEGORY
// ============================================
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, icon, color, description } = req.body;

  const category = await prisma.category.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!category) {
    throw new AppError('Category not found or you cannot edit it', HTTP_STATUS.NOT_FOUND);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(icon && { icon }),
      ...(color && { color }),
      ...(description !== undefined && { description }),
    },
  });

  return sendSuccess(res, updated, 'Category updated successfully');
});

// ============================================
// DELETE CATEGORY
// ============================================
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findFirst({
    where: { id, userId: req.user.id },
    include: { _count: { select: { transactions: true } } },
  });

  if (!category) {
    throw new AppError('Category not found or you cannot delete it', HTTP_STATUS.NOT_FOUND);
  }

  if (category._count.transactions > 0) {
    throw new AppError(
      `Cannot delete category with ${category._count.transactions} transactions. Please reassign or delete them first.`,
      HTTP_STATUS.CONFLICT
    );
  }

  await prisma.category.delete({ where: { id } });

  return sendSuccess(res, null, 'Category deleted successfully');
});
