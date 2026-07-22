const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// ============================================
// Validation Result Handler Middleware
// ============================================
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    throw new ApiError(422, 'Validation failed', formattedErrors);
  }

  next();
};

module.exports = { validate };
