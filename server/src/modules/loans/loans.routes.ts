import { Router } from 'express';
import { LoansController } from './loans.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createLoanSchema,
  updateLoanSchema,
  recordRepaymentSchema,
  loanParamsSchema,
  listLoansQuerySchema,
} from './loans.schema';

const router = Router();

// All loan routes require authentication
router.use(authenticate);

// POST /api/loans
router.post(
  '/',
  validate(createLoanSchema),
  LoansController.create
);

// GET /api/loans
router.get(
  '/',
  validate(listLoansQuerySchema),
  LoansController.list
);

// GET /api/loans/:id
router.get(
  '/:id',
  validate(loanParamsSchema),
  LoansController.getById
);

// PATCH /api/loans/:id/repay
router.patch(
  '/:id/repay',
  validate(recordRepaymentSchema),
  LoansController.repay
);

// PATCH /api/loans/:id
router.patch(
  '/:id',
  validate(updateLoanSchema),
  LoansController.update
);

// DELETE /api/loans/:id
router.delete(
  '/:id',
  validate(loanParamsSchema),
  LoansController.delete
);

export const loansRoutes = router;
