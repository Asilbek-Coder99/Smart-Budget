import { body, query } from 'express-validator';

export const createTransactionValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be 2-100 characters'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['INCOME', 'EXPENSE']).withMessage('Type must be INCOME or EXPENSE'),

  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isString().withMessage('Category ID must be a string'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO date'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 characters'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Note max 300 characters'),
];

export const updateTransactionValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Title must be 2-100 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),

  body('categoryId')
    .optional()
    .isString(),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be valid'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 300 }),
];
