import { Router } from 'express';
import { getStats, getUsers, getUserById, toggleUserStatus, deleteUser } from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = Router();
router.use(protect, restrictTo('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
