import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, AlertCircle, ChevronRight } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing, formatDate } from '../constants/theme';
import { Loan } from '../types';
import { StatusBadge } from './StatusBadge';

interface LoanCardProps {
  loan: Loan;
  onPress: () => void;
}

export function LoanCard({ loan, onPress }: LoanCardProps) {
  // Generate initials from friend name
  const initials = loan.friendName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.card,
        Shadows.card,
        loan.isOverdue && styles.overdueCardBorder,
      ]}
    >
      {/* Top Row: Avatar, Name & Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.friendInfo}>
          <View style={[styles.avatar, loan.isOverdue && styles.overdueAvatar]}>
            <Text style={[styles.avatarText, loan.isOverdue && styles.overdueAvatarText]}>
              {initials || 'FR'}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.friendName} numberOfLines={1}>
              {loan.friendName}
            </Text>
            {loan.notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                {loan.notes}
              </Text>
            ) : null}
          </View>
        </View>

        <StatusBadge status={loan.status} isOverdue={loan.isOverdue} />
      </View>

      {/* Overdue Banner if overdue */}
      {loan.isOverdue && (
        <View style={styles.overdueBanner}>
          <AlertCircle size={14} color={Colors.danger} />
          <Text style={styles.overdueBannerText}>
            Overdue by {loan.overdueDays} {loan.overdueDays === 1 ? 'day' : 'days'} • Immediate attention
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(100, Math.max(0, loan.percentageRepaid))}%`,
                backgroundColor: loan.status === 'REPAID' ? Colors.primary : Colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{loan.percentageRepaid}% repaid</Text>
      </View>

      {/* Financial Details Row */}
      <View style={styles.detailsRow}>
        <View>
          <Text style={styles.detailLabel}>REMAINING</Text>
          <Text
            style={[
              styles.remainingAmount,
              loan.isOverdue && styles.overdueRemainingText,
            ]}
          >
            {loan.remainingBalanceFormatted}
          </Text>
        </View>

        <View style={styles.alignRight}>
          <Text style={styles.detailLabel}>ORIGINAL LENT</Text>
          <Text style={styles.originalAmount}>{loan.amountFormatted}</Text>
        </View>
      </View>

      {/* Footer: Due date & view arrow */}
      <View style={styles.footerRow}>
        <View style={styles.dueDateWrapper}>
          <Calendar size={13} color={loan.isOverdue ? Colors.danger : Colors.textMuted} />
          <Text
            style={[
              styles.dueDateText,
              loan.isOverdue && styles.overdueDateText,
            ]}
          >
            Due {formatDate(loan.dueDate)}
          </Text>
        </View>

        <View style={styles.arrowRow}>
          <Text style={styles.viewDetailsText}>Details</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overdueCardBorder: {
    borderColor: Colors.dangerBorder,
    backgroundColor: '#FFFBFB',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  overdueAvatar: {
    backgroundColor: Colors.dangerLight,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  overdueAvatarText: {
    color: Colors.danger,
  },
  nameContainer: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    gap: 6,
    marginVertical: Spacing.xs,
  },
  overdueBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 65,
    textAlign: 'right',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: Spacing.xs,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  overdueRemainingText: {
    color: Colors.danger,
  },
  originalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  dueDateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  overdueDateText: {
    color: Colors.danger,
    fontWeight: '600',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
