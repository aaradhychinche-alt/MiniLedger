import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { toNumber, formatINR } from '../../utils/currency';
import { isLoanOverdue, getOverdueDays } from '../../utils/date';
import { env } from '../../config/env';
import { CreateLoanInput, UpdateLoanInput, RecordRepaymentInput } from './loans.schema';

export interface ComputedLoan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  amountFormatted: string;
  amountRepaid: number;
  amountRepaidFormatted: string;
  remainingBalance: number;
  remainingBalanceFormatted: string;
  percentageRepaid: number;
  status: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID';
  dueDate: string;
  isOverdue: boolean;
  overdueDays: number;
  notes: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  repayments?: Array<{
    id: string;
    amount: number;
    amountFormatted: string;
    notes: string | null;
    createdAt: string;
  }>;
}

export function computeLoanDetails(
  loan: {
    id: string;
    userId: string;
    friendName: string;
    amount: Prisma.Decimal;
    dueDate: Date;
    notes: string | null;
    receiptUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    repayments?: Array<{
      id: string;
      amount: Prisma.Decimal;
      notes: string | null;
      createdAt: Date;
    }>;
  },
  tz: string = env.TZ
): ComputedLoan {
  const amount = toNumber(loan.amount);
  const repayments = loan.repayments || [];
  const amountRepaid = repayments.reduce((sum, r) => sum + toNumber(r.amount), 0);
  const remainingBalance = Math.max(0, Math.round((amount - amountRepaid) * 100) / 100);

  let status: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID' = 'PENDING';
  if (remainingBalance <= 0) {
    status = 'REPAID';
  } else if (amountRepaid > 0) {
    status = 'PARTIALLY_REPAID';
  }

  const isOverdue = isLoanOverdue(loan.dueDate, tz) && remainingBalance > 0;
  const overdueDays = isOverdue ? getOverdueDays(loan.dueDate, tz) : 0;
  const percentageRepaid = amount > 0 ? Math.min(100, Math.round((amountRepaid / amount) * 100)) : 0;

  return {
    id: loan.id,
    userId: loan.userId,
    friendName: loan.friendName,
    amount,
    amountFormatted: formatINR(amount),
    amountRepaid,
    amountRepaidFormatted: formatINR(amountRepaid),
    remainingBalance,
    remainingBalanceFormatted: formatINR(remainingBalance),
    percentageRepaid,
    status,
    dueDate: loan.dueDate.toISOString(),
    isOverdue,
    overdueDays,
    notes: loan.notes,
    receiptUrl: loan.receiptUrl,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
    ...(loan.repayments && {
      repayments: loan.repayments.map((r) => {
        const repAmount = toNumber(r.amount);
        return {
          id: r.id,
          amount: repAmount,
          amountFormatted: formatINR(repAmount),
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
        };
      }),
    }),
  };
}

export class LoansService {
  /**
   * Create a new loan
   */
  static async createLoan(userId: string, input: CreateLoanInput): Promise<ComputedLoan> {
    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: input.friendName,
        amount: new Prisma.Decimal(input.amount),
        dueDate: input.dueDate,
        notes: input.notes,
        receiptUrl: input.receiptUrl,
      },
      include: {
        repayments: true,
      },
    });

    return computeLoanDetails(loan);
  }

  /**
   * List user's loans with optional status filtering and friend name search
   */
  static async listLoans(
    userId: string,
    filters: { status?: 'all' | 'active' | 'overdue' | 'repaid'; search?: string }
  ): Promise<ComputedLoan[]> {
    const whereClause: Prisma.LoanWhereInput = {
      userId,
      ...(filters.search && {
        friendName: {
          contains: filters.search,
          mode: 'insensitive',
        },
      }),
    };

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        repayments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const computed = loans.map((l) => computeLoanDetails(l));

    // Post-filter by status if specified
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        return computed.filter((l) => l.remainingBalance > 0);
      }
      if (filters.status === 'overdue') {
        return computed.filter((l) => l.isOverdue);
      }
      if (filters.status === 'repaid') {
        return computed.filter((l) => l.status === 'REPAID');
      }
    }

    return computed;
  }

  /**
   * Get single loan by ID
   */
  static async getLoanById(userId: string, loanId: string): Promise<ComputedLoan> {
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
      include: {
        repayments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    return computeLoanDetails(loan);
  }

  /**
   * Record a repayment within a transaction
   */
  static async recordRepayment(
    userId: string,
    loanId: string,
    input: RecordRepaymentInput
  ): Promise<ComputedLoan> {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId },
        include: { repayments: true },
      });

      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      const originalAmount = toNumber(loan.amount);
      const totalRepaidSoFar = loan.repayments.reduce((sum, r) => sum + toNumber(r.amount), 0);
      const remainingBalance = Math.max(0, Math.round((originalAmount - totalRepaidSoFar) * 100) / 100);

      if (remainingBalance <= 0) {
        throw new AppError('This loan has already been fully repaid.', 400);
      }

      if (input.amount <= 0) {
        throw new AppError('Repayment amount must be greater than zero.', 400);
      }

      // Check repayment does not exceed remaining balance
      if (input.amount > remainingBalance) {
        throw new AppError(
          `Repayment amount of ${formatINR(input.amount)} exceeds remaining balance of ${formatINR(remainingBalance)}.`,
          400
        );
      }

      // Create repayment record
      await tx.repayment.create({
        data: {
          loanId: loan.id,
          amount: new Prisma.Decimal(input.amount),
          notes: input.notes,
        },
      });

      // Fetch fresh loan state with repayments
      const updatedLoan = await tx.loan.findUniqueOrThrow({
        where: { id: loan.id },
        include: {
          repayments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return computeLoanDetails(updatedLoan);
    });
  }

  /**
   * Update editable loan details
   */
  static async updateLoan(
    userId: string,
    loanId: string,
    input: UpdateLoanInput
  ): Promise<ComputedLoan> {
    const existing = await prisma.loan.findFirst({
      where: { id: loanId, userId },
      include: { repayments: true },
    });

    if (!existing) {
      throw new AppError('Loan not found', 404);
    }

    // If updating amount, ensure it is not less than already repaid amount
    if (input.amount !== undefined) {
      const totalRepaid = existing.repayments.reduce((sum, r) => sum + toNumber(r.amount), 0);
      if (input.amount < totalRepaid) {
        throw new AppError(
          `New loan amount (${formatINR(input.amount)}) cannot be less than already repaid amount (${formatINR(totalRepaid)}).`,
          400
        );
      }
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        ...(input.friendName && { friendName: input.friendName }),
        ...(input.amount !== undefined && { amount: new Prisma.Decimal(input.amount) }),
        ...(input.dueDate && { dueDate: input.dueDate }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.receiptUrl !== undefined && { receiptUrl: input.receiptUrl }),
      },
      include: {
        repayments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return computeLoanDetails(updated);
  }

  /**
   * Delete a loan
   */
  static async deleteLoan(userId: string, loanId: string): Promise<{ id: string }> {
    const existing = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });

    if (!existing) {
      throw new AppError('Loan not found', 404);
    }

    await prisma.loan.delete({
      where: { id: loanId },
    });

    return { id: loanId };
  }
}
