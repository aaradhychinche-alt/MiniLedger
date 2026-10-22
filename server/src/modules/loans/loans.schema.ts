import { z } from 'zod';

export const createLoanSchema = z.object({
  body: z.object({
    friendName: z.string().trim().min(1, "Friend's name is required").max(100),
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Loan amount must be greater than zero')
      .max(10000000, 'Loan amount exceeds maximum allowed limit'),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid due date' })
      .transform((val) => new Date(val)),
    notes: z.string().trim().max(1000).optional().nullable(),
    receiptUrl: z.string().url('Receipt URL must be a valid URL').optional().nullable(),
  }),
});

export const updateLoanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid loan ID format'),
  }),
  body: z.object({
    friendName: z.string().trim().min(1).max(100).optional(),
    amount: z.number().positive().max(10000000).optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date' })
      .transform((val) => new Date(val))
      .optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
    receiptUrl: z.string().url().optional().nullable(),
  }),
});

export const recordRepaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid loan ID format'),
  }),
  body: z.object({
    amount: z
      .number({ invalid_type_error: 'Repayment amount must be a number' })
      .positive('Repayment amount must be greater than zero')
      .max(10000000),
    notes: z.string().trim().max(500).optional().nullable(),
  }),
});

export const loanParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid loan ID format'),
  }),
});

export const listLoansQuerySchema = z.object({
  query: z.object({
    status: z.enum(['all', 'active', 'overdue', 'repaid']).optional().default('all'),
    search: z.string().optional(),
  }),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>['body'];
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>['body'];
export type RecordRepaymentInput = z.infer<typeof recordRepaymentSchema>['body'];
