import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii } from '../constants/theme';
import { LoanStatus } from '../types';

interface StatusBadgeProps {
  status: LoanStatus;
  isOverdue?: boolean;
}

export function StatusBadge({ status, isOverdue }: StatusBadgeProps) {
  if (isOverdue && status !== 'REPAID') {
    return (
      <View style={[styles.badge, styles.overdueBadge]}>
        <View style={styles.overdueDot} />
        <Text style={styles.overdueText}>Overdue</Text>
      </View>
    );
  }

  switch (status) {
    case 'REPAID':
      return (
        <View style={[styles.badge, styles.repaidBadge]}>
          <Text style={styles.repaidText}>Fully Repaid</Text>
        </View>
      );
    case 'PARTIALLY_REPAID':
      return (
        <View style={[styles.badge, styles.partialBadge]}>
          <Text style={styles.partialText}>Partially Repaid</Text>
        </View>
      );
    case 'PENDING':
    default:
      return (
        <View style={[styles.badge, styles.pendingBadge]}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pendingBadge: {
    backgroundColor: Colors.statusPending.bg,
    borderColor: Colors.statusPending.border,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.statusPending.text,
  },
  partialBadge: {
    backgroundColor: Colors.statusPartial.bg,
    borderColor: Colors.statusPartial.border,
  },
  partialText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.statusPartial.text,
  },
  repaidBadge: {
    backgroundColor: Colors.statusRepaid.bg,
    borderColor: Colors.statusRepaid.border,
  },
  repaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.statusRepaid.text,
  },
  overdueBadge: {
    backgroundColor: Colors.statusOverdue.bg,
    borderColor: Colors.statusOverdue.border,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.statusOverdue.text,
  },
  overdueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },
});
