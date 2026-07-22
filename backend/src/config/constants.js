// Application-wide constants

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
};

export const MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Account created successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already in use',
  USERNAME_EXISTS: 'Username already taken',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  TOKEN_INVALID: 'Invalid or expired token',

  // Generic
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation failed',
  SUCCESS: 'Operation successful',
  DELETED: 'Deleted successfully',
  UPDATED: 'Updated successfully',
  CREATED: 'Created successfully',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const FILE_UPLOAD = {
  MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  UPLOAD_DIR: process.env.UPLOAD_PATH || 'uploads',
};

export const BUDGET_ALERT_THRESHOLD = 80; // percent
