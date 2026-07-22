import { Router } from 'express';
import { getBudgets, getBudget, createBudget, updateBudget, deleteBudget } from '../controllers/budget.controller.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createBudgetValidator, updateBudgetValidator } from '../validators/budget.validators.js';

const router = Router();
router.use(protect);

router.get('/', getBudgets);
router.get('/:id', getBudget);
router.post('/', createBudgetValidator, validate, createBudget);
router.put('/:id', updateBudgetValidator, validate, updateBudget);
router.delete('/:id', deleteBudget);

export default router;
