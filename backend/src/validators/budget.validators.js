import { body } from 'express-validator';

export const createBudgetValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Budget name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('amount')
    .notEmpty().withMessage('Budget amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),

  body('categoryId')
    .notEmpty().withMessage('Category is required'),

  body('month')
    .notEmpty().withMessage('Month is required')
    .isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),

  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 2020, max: 2099 }).withMessage('Year must be valid'),

  body('alertAt')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Alert threshold must be 1-100'),
];

export const updateBudgetValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('amount').optional().isFloat({ min: 1 }),
  body('alertAt').optional().isInt({ min: 1, max: 100 }),
];
