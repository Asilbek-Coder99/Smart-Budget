// ============================================
// Standardized API Response Helpers
// ============================================

/**
 * Send success response
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Send created response (201)
 */
const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Calculate pagination metadata
 */
const getPagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / perPage);

  return {
    total,
    totalPages,
    currentPage,
    perPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Get skip value for Prisma pagination
 */
const getSkip = (page, limit) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
  return (currentPage - 1) * perPage;
};

module.exports = { sendSuccess, sendPaginated, sendCreated, getPagination, getSkip };
