import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createCategoryValidator, updateCategoryValidator } from '../validators/category.validators.js';

const router = Router();

router.use(protect);

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', createCategoryValidator, validate, createCategory);
router.put('/:id', updateCategoryValidator, validate, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
