import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getDashboardStats,
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { updateProfileValidator } from '../validators/user.validators.js';
import upload from '../middlewares/upload.js';

const router = Router();

// All routes protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidator, validate, updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);
router.get('/dashboard', getDashboardStats);

export default router;
