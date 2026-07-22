import { Router } from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
} from '../controllers/transaction.controller.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createTransactionValidator, updateTransactionValidator } from '../validators/transaction.validators.js';

const router = Router();

router.use(protect);

router.get('/', getTransactions);
router.get('/monthly-summary', getMonthlySummary);
router.get('/:id', getTransaction);
router.post('/', createTransactionValidator, validate, createTransaction);
router.put('/:id', updateTransactionValidator, validate, updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
