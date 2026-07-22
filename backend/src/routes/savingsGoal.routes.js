import { Router } from 'express';
import {
  getSavingsGoals, getSavingsGoal, createSavingsGoal,
  updateSavingsGoal, deleteSavingsGoal, addContribution,
} from '../controllers/savingsGoal.controller.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', getSavingsGoals);
router.get('/:id', getSavingsGoal);
router.post('/', createSavingsGoal);
router.put('/:id', updateSavingsGoal);
router.delete('/:id', deleteSavingsGoal);
router.post('/:id/contribute', addContribution);

export default router;
