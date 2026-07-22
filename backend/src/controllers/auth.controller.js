import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.js';
import { AppError, catchAsync } from '../utils/AppError.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { MESSAGES, HTTP_STATUS } from '../config/constants.js';

// ============================================
// REGISTER
// ============================================
export const register = catchAsync(async (req, res) => {
  const { email, username, firstName, lastName, password } = req.body;

  // Check for existing email or username
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    if (existing.email === email) {
      throw new AppError(MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
    }
    throw new AppError(MESSAGES.USERNAME_EXISTS, HTTP_STATUS.CONFLICT);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: { email, username, firstName, lastName, passwordHash },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      currency: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokens = generateTokenPair(user);

  return sendCreated(res, { user, ...tokens }, MESSAGES.REGISTER_SUCCESS);
});

// ============================================
// LOGIN
// ============================================
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password hash
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      role: true,
      avatar: true,
      isActive: true,
      currency: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated.', HTTP_STATUS.FORBIDDEN);
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Remove hash from response
  const { passwordHash, ...safeUser } = user;

  // Generate tokens
  const tokens = generateTokenPair(safeUser);

  return sendSuccess(res, { user: safeUser, ...tokens }, MESSAGES.LOGIN_SUCCESS);
});

// ============================================
// GET CURRENT USER (ME)
// ============================================
export const getMe = catchAsync(async (req, res) => {
  // req.user already attached by protect middleware
  // Fetch fresh data with extra fields
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      isActive: true,
      currency: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          transactions: true,
          categories: true,
          budgets: true,
          savingsGoals: true,
        },
      },
    },
  });

  return sendSuccess(res, user);
});

// ============================================
// REFRESH TOKEN
// ============================================
export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED);
  }

  // Make sure user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('User not found or deactivated', HTTP_STATUS.UNAUTHORIZED);
  }

  const tokens = generateTokenPair(user);
  return sendSuccess(res, tokens, 'Token refreshed');
});

// ============================================
// CHANGE PASSWORD
// ============================================
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Fetch user with hash
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, passwordHash: true },
  });

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: newHash },
  });

  return sendSuccess(res, null, 'Password changed successfully');
});

// ============================================
// LOGOUT (client-side — just confirmation)
// ============================================
export const logout = catchAsync(async (req, res) => {
  // In a stateless JWT setup, logout is handled on the client by deleting the token.
  // Here we just return a confirmation.
  return sendSuccess(res, null, MESSAGES.LOGOUT_SUCCESS);
});
