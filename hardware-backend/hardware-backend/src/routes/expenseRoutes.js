import { Router } from 'express';
import * as controller from '../controllers/expenseController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createExpenseSchema, listExpensesSchema } from '../validations/expenseValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listExpensesSchema), requirePermission('report.view'), controller.listExpenses);
router.post('/', validate(createExpenseSchema), requirePermission('report.view'), controller.createExpense);
router.delete('/:id', requirePermission('report.view'), controller.deleteExpense);

export default router;
