import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Loan } from '../types';

export function useLoansList(status: 'all' | 'active' | 'overdue' | 'repaid' = 'all', search?: string) {
  return useQuery({
    queryKey: ['loans', { status, search }],
    queryFn: async () => {
      const res = await apiClient.get<{ loans: Loan[]; count: number }>('/loans', {
        status,
        search,
      });
      return res.loans;
    },
  });
}

export function useLoanDetails(loanId: string) {
  return useQuery({
    queryKey: ['loan', loanId],
    queryFn: async () => {
      const res = await apiClient.get<{ loan: Loan }>(`/loans/${loanId}`);
      return res.loan;
    },
    enabled: !!loanId,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      friendName: string;
      amount: number;
      dueDate: string;
      notes?: string;
      receiptUrl?: string | null;
    }) => {
      const res = await apiClient.post<{ loan: Loan }>('/loans', input);
      return res.loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useRecordRepayment(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { amount: number; notes?: string }) => {
      const res = await apiClient.patch<{ loan: Loan }>(`/loans/${loanId}/repay`, input);
      return res.loan;
    },
    onSuccess: (updatedLoan) => {
      queryClient.setQueryData(['loan', loanId], updatedLoan);
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => {
      return await apiClient.delete<{ id: string }>(`/loans/${loanId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
