import { body } from 'express-validator';

export const updateProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code (e.g. USD)'),

  body('timezone')
    .optional()
    .isString().withMessage('Timezone must be a string'),
];
