import { body } from 'express-validator';

export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('type')
    .notEmpty().withMessage('Category type is required')
    .isIn(['INCOME', 'EXPENSE']).withMessage('Type must be INCOME or EXPENSE'),

  body('icon')
    .optional()
    .isString().withMessage('Icon must be a string'),

  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).withMessage('Color must be a valid hex color'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description max 200 characters'),
];

export const updateCategoryValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('icon').optional().isString(),

  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).withMessage('Invalid hex color'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }),
];
