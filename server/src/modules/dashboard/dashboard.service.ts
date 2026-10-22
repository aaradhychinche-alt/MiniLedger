import { prisma } from '../../config/database';
import { toNumber, formatINR } from '../../utils/currency';
import { isLoanOverdue } from '../../utils/date';
import { env } from '../../config/env';

export interface DashboardSummary {
  totalLent: number;
  totalLentFormatted: string;
  totalRepaid: number;
  totalRepaidFormatted: string;
  outstandingAmount: number;
  outstandingAmountFormatted: string;
  overdueAmount: number;
  overdueAmountFormatted: string;
  activeLoanCount: number;
  overdueLoanCount: number;
  fullyRepaidLoanCount: number;
  totalLoanCount: number;
  recentLoans: any[];
}

export class DashboardService {
  /**
   * Calculates dashboard summary aggregation metrics for authenticated user
   */
  static async getSummary(userId: string): Promise<DashboardSummary> {
    // Fetch all user's loans with repayments for consistent calculation
    const loans = await prisma.loan.findMany({
      where: { userId },
      include: {
        repayments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalLent = 0;
    let totalRepaid = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;
    let activeLoanCount = 0;
    let overdueLoanCount = 0;
    let fullyRepaidLoanCount = 0;

    for (const loan of loans) {
      const loanAmount = toNumber(loan.amount);
      const loanRepaid = loan.repayments.reduce((sum, r) => sum + toNumber(r.amount), 0);
      const remainingBalance = Math.max(0, Math.round((loanAmount - loanRepaid) * 100) / 100);

      totalLent += loanAmount;
      totalRepaid += loanRepaid;

      if (remainingBalance <= 0) {
        fullyRepaidLoanCount++;
      } else {
        activeLoanCount++;
        outstandingAmount += remainingBalance;

        if (isLoanOverdue(loan.dueDate, env.TZ)) {
          overdueLoanCount++;
          overdueAmount += remainingBalance;
        }
      }
    }

    // Round all totals to 2 decimal places
    totalLent = Math.round(totalLent * 100) / 100;
    totalRepaid = Math.round(totalRepaid * 100) / 100;
    outstandingAmount = Math.round(outstandingAmount * 100) / 100;
    overdueAmount = Math.round(overdueAmount * 100) / 100;

    // Take recent 5 loans
    const recentLoans = loans.slice(0, 5).map((l) => {
      const amount = toNumber(l.amount);
      const repaid = l.repayments.reduce((sum, r) => sum + toNumber(r.amount), 0);
      const remaining = Math.max(0, Math.round((amount - repaid) * 100) / 100);
      const isOverdue = isLoanOverdue(l.dueDate, env.TZ) && remaining > 0;

      let status: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID' = 'PENDING';
      if (remaining <= 0) status = 'REPAID';
      else if (repaid > 0) status = 'PARTIALLY_REPAID';

      return {
        id: l.id,
        friendName: l.friendName,
        amount,
        amountFormatted: formatINR(amount),
        amountRepaid: repaid,
        amountRepaidFormatted: formatINR(repaid),
        remainingBalance: remaining,
        remainingBalanceFormatted: formatINR(remaining),
        status,
        dueDate: l.dueDate.toISOString(),
        isOverdue,
        percentageRepaid: amount > 0 ? Math.min(100, Math.round((repaid / amount) * 100)) : 0,
        createdAt: l.createdAt.toISOString(),
      };
    });

    return {
      totalLent,
      totalLentFormatted: formatINR(totalLent),
      totalRepaid,
      totalRepaidFormatted: formatINR(totalRepaid),
      outstandingAmount,
      outstandingAmountFormatted: formatINR(outstandingAmount),
      overdueAmount,
      overdueAmountFormatted: formatINR(overdueAmount),
      activeLoanCount,
      overdueLoanCount,
      fullyRepaidLoanCount,
      totalLoanCount: loans.length,
      recentLoans,
    };
  }
}
