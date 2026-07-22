import api from './axios.js';

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  getMe:    ()     => api.get('/auth/me'),
  refreshToken: (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ═══════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════
export const userService = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.put('/users/profile', data),
  uploadAvatar:   (form) => api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAvatar:   ()     => api.delete('/users/avatar'),
  getDashboard:   ()     => api.get('/users/dashboard'),
};

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════
export const categoryService = {
  getAll:   (params) => api.get('/categories', { params }),
  getOne:   (id)     => api.get(`/categories/${id}`),
  create:   (data)   => api.post('/categories', data),
  update:   (id, d)  => api.put(`/categories/${id}`, d),
  delete:   (id)     => api.delete(`/categories/${id}`),
};

// ═══════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════
export const transactionService = {
  getAll:          (params) => api.get('/transactions', { params }),
  getOne:          (id)     => api.get(`/transactions/${id}`),
  create:          (data)   => api.post('/transactions', data),
  update:          (id, d)  => api.put(`/transactions/${id}`, d),
  delete:          (id)     => api.delete(`/transactions/${id}`),
  getMonthlySummary: (p)    => api.get('/transactions/monthly-summary', { params: p }),
};

// ═══════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════
export const budgetService = {
  getAll:   (params) => api.get('/budgets', { params }),
  getOne:   (id)     => api.get(`/budgets/${id}`),
  create:   (data)   => api.post('/budgets', data),
  update:   (id, d)  => api.put(`/budgets/${id}`, d),
  delete:   (id)     => api.delete(`/budgets/${id}`),
};

// ═══════════════════════════════════════════
// SAVINGS GOALS
// ═══════════════════════════════════════════
export const savingsGoalService = {
  getAll:      (params) => api.get('/savings-goals', { params }),
  getOne:      (id)     => api.get(`/savings-goals/${id}`),
  create:      (data)   => api.post('/savings-goals', data),
  update:      (id, d)  => api.put(`/savings-goals/${id}`, d),
  delete:      (id)     => api.delete(`/savings-goals/${id}`),
  contribute:  (id, d)  => api.post(`/savings-goals/${id}/contribute`, d),
};

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════
export const notificationService = {
  getAll:          (params) => api.get('/notifications', { params }),
  getUnreadCount:  ()       => api.get('/notifications/unread-count'),
  markAsRead:      (id)     => api.put(`/notifications/${id}/read`),
  markAllAsRead:   ()       => api.put('/notifications/mark-all-read'),
  delete:          (id)     => api.delete(`/notifications/${id}`),
  deleteAll:       ()       => api.delete('/notifications'),
};

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════
export const analyticsService = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getInsights: ()       => api.get('/analytics/insights'),
};

// ═══════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════
export const reportService = {
  getAll:       ()       => api.get('/reports'),
  getSummary:   (params) => api.get('/reports/summary', { params }),
  exportCSV:    (params) => api.get('/reports/export/csv',   { params, responseType: 'blob' }),
  exportExcel:  (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
};

// ═══════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════
export const adminService = {
  getStats:         ()      => api.get('/admin/stats'),
  getUsers:         (params)=> api.get('/admin/users', { params }),
  getUserById:      (id)    => api.get(`/admin/users/${id}`),
  toggleStatus:     (id)    => api.patch(`/admin/users/${id}/toggle-status`),
  deleteUser:       (id)    => api.delete(`/admin/users/${id}`),
};
