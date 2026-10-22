export interface User {
  id: string;
  phoneNumber: string;
  name?: string | null;
  createdAt: string;
}

export type LoanStatus = 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID';

export interface Repayment {
  id: string;
  amount: number;
  amountFormatted: string;
  notes?: string | null;
  createdAt: string;
}

export interface Loan {
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
  status: LoanStatus;
  dueDate: string;
  isOverdue: boolean;
  overdueDays: number;
  notes?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  repayments?: Repayment[];
}

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
  recentLoans: Loan[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: { field: string; message: string }[];
}
