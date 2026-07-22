import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  changePassword,
  logout,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from '../validators/auth.validators.js';

const router = Router();

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/change-password', changePasswordValidator, validate, changePassword);

export default router;
