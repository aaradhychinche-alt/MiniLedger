import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Clock,
  Check,
  Plus,
} from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing, formatDate } from '../../constants/theme';
import { useLoanDetails, useRecordRepayment, useDeleteLoan } from '../../hooks/useLoans';
import { StatusBadge } from '../../components/StatusBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RepaymentModal } from '../../components/RepaymentModal';
import { ReceiptModal } from '../../components/ReceiptModal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ErrorState } from '../../components/ErrorState';

export default function LoanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: loan, isLoading, error, refetch } = useLoanDetails(id as string);
  const recordRepaymentMutation = useRecordRepayment(id as string);
  const deleteLoanMutation = useDeleteLoan();

  // Modals
  const [isRepayModalVisible, setIsRepayModalVisible] = useState(false);
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await deleteLoanMutation.mutateAsync(id as string);
        router.back();
      } catch (err: any) {
        Alert.alert('Delete Failed', err.message || 'Unable to delete loan.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete the loan for ${loan?.friendName}?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Loan',
        `Are you sure you want to delete this loan for ${loan?.friendName}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleRecordRepayment = async (amount: number, notes?: string) => {
    try {
      await recordRepaymentMutation.mutateAsync({ amount, notes });
      setIsRepayModalVisible(false);
    } catch (err: any) {
      Alert.alert('Repayment Failed', err.message || 'Unable to record repayment.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={styles.placeholder} />
        </View>
        <LoadingSkeleton count={3} />
      </SafeAreaView>
    );
  }

  if (error || !loan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={styles.placeholder} />
        </View>
        <ErrorState
          title="Loan Not Found"
          message={error instanceof Error ? error.message : 'Unable to load loan details.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const initials = loan.friendName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButton}
          disabled={deleteLoanMutation.isPending}
        >
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Friend Profile Card */}
        <View style={[styles.profileCard, Shadows.card]}>
          <View style={[styles.avatar, loan.isOverdue && styles.avatarOverdue]}>
            <Text style={[styles.avatarText, loan.isOverdue && styles.avatarTextOverdue]}>
              {initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.friendName}>{loan.friendName}</Text>
            <Text style={styles.createdDate}>
              Lent on {formatDate(loan.createdAt)}
            </Text>
          </View>
          <StatusBadge status={loan.status} isOverdue={loan.isOverdue} />
        </View>

        {/* Overdue Warning Alert */}
        {loan.isOverdue && (
          <View style={styles.overdueAlert}>
            <AlertTriangle size={18} color={Colors.danger} />
            <View style={styles.overdueAlertTextWrap}>
              <Text style={styles.overdueAlertTitle}>
                Overdue by {loan.overdueDays} {loan.overdueDays === 1 ? 'day' : 'days'}
              </Text>
              <Text style={styles.overdueAlertDesc}>
                This loan was due on {formatDate(loan.dueDate)}. Reach out to {loan.friendName} for repayment.
              </Text>
            </View>
          </View>
        )}

        {/* Financial Overview Card */}
        <View style={[styles.balanceCard, Shadows.card]}>
          <Text style={styles.balanceCardLabel}>OUTSTANDING BALANCE</Text>
          <Text
            style={[
              styles.balanceCardAmount,
              loan.isOverdue && styles.balanceOverdueAmount,
              loan.status === 'REPAID' && styles.balanceRepaidAmount,
            ]}
          >
            {loan.remainingBalanceFormatted}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min(100, Math.max(0, loan.percentageRepaid))}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressPercentText}>
                {loan.percentageRepaid}% Repaid
              </Text>
              <Text style={styles.progressRatioText}>
                {loan.amountRepaidFormatted} of {loan.amountFormatted}
              </Text>
            </View>
          </View>

          {/* Financial Breakdown Grid */}
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Original Amount</Text>
              <Text style={styles.breakdownValue}>{loan.amountFormatted}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Total Repaid</Text>
              <Text style={[styles.breakdownValue, styles.repaidValue]}>
                {loan.amountRepaidFormatted}
              </Text>
            </View>
          </View>
        </View>

        {/* Due Date & Notes Info */}
        <View style={[styles.infoCard, Shadows.card]}>
          <View style={styles.infoRow}>
            <Calendar size={18} color={loan.isOverdue ? Colors.danger : Colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text
                style={[
                  styles.infoValue,
                  loan.isOverdue && styles.infoValueOverdue,
                ]}
              >
                {formatDate(loan.dueDate)}
                {loan.isOverdue ? ` (Past Due)` : ''}
              </Text>
            </View>
          </View>

          {loan.notes && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.notesSection}>
                <Text style={styles.infoLabel}>Notes / Purpose</Text>
                <Text style={styles.notesBody}>{loan.notes}</Text>
              </View>
            </>
          )}

          {loan.receiptUrl && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.receiptRow}>
                <Receipt size={18} color={Colors.primary} />
                <View style={styles.receiptInfo}>
                  <Text style={styles.infoLabel}>Attached Proof / Receipt</Text>
                  <TouchableOpacity
                    onPress={() => setIsReceiptModalVisible(true)}
                    style={styles.viewReceiptLink}
                  >
                    <Text style={styles.viewReceiptText}>View Receipt Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Action Button: Record Repayment or Fully Repaid Notice */}
        {loan.remainingBalance > 0 ? (
          <PrimaryButton
            title="Record Repayment"
            onPress={() => setIsRepayModalVisible(true)}
            icon={<Plus size={18} color={Colors.textInverse} />}
            size="lg"
            style={styles.repayButton}
          />
        ) : (
          <View style={styles.completedNotice}>
            <CheckCircle2 size={24} color={Colors.primary} />
            <Text style={styles.completedNoticeTitle}>Fully Repaid!</Text>
            <Text style={styles.completedNoticeDesc}>
              This loan has been completely settled. No outstanding balance remains.
            </Text>
          </View>
        )}

        {/* Repayment History Timeline */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.historyTitle}>Repayment History</Text>
          </View>

          {!loan.repayments || loan.repayments.length === 0 ? (
            <View style={styles.noRepaymentsBox}>
              <Text style={styles.noRepaymentsText}>
                No repayments have been recorded yet.
              </Text>
            </View>
          ) : (
            loan.repayments.map((rep, idx) => (
              <View key={rep.id} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <Check size={10} color={Colors.textInverse} />
                </View>
                <View style={[styles.timelineCard, Shadows.card]}>
                  <View style={styles.timelineCardHeader}>
                    <Text style={styles.timelineAmount}>
                      {rep.amountFormatted}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {formatDate(rep.createdAt)}
                    </Text>
                  </View>
                  {rep.notes ? (
                    <Text style={styles.timelineNotes}>{rep.notes}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Record Repayment Modal */}
      <RepaymentModal
        visible={isRepayModalVisible}
        onClose={() => setIsRepayModalVisible(false)}
        friendName={loan.friendName}
        remainingBalance={loan.remainingBalance}
        remainingBalanceFormatted={loan.remainingBalanceFormatted}
        onSubmit={handleRecordRepayment}
        isLoading={recordRepaymentMutation.isPending}
      />

      {/* Full-screen Receipt Image Modal */}
      <ReceiptModal
        visible={isReceiptModalVisible}
        onClose={() => setIsReceiptModalVisible(false)}
        imageUrl={loan.receiptUrl || null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  iconButton: {
    padding: 6,
    borderRadius: Radii.full,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  deleteButton: {
    padding: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.dangerLight,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarOverdue: {
    backgroundColor: Colors.dangerLight,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  avatarTextOverdue: {
    color: Colors.danger,
  },
  profileInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  createdDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  overdueAlert: {
    flexDirection: 'row',
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  overdueAlertTextWrap: {
    flex: 1,
  },
  overdueAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  overdueAlertDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  balanceCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  balanceCardAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginVertical: Spacing.xs,
  },
  balanceOverdueAmount: {
    color: Colors.danger,
  },
  balanceRepaidAmount: {
    color: Colors.primary,
  },
  progressSection: {
    marginVertical: Spacing.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressRatioText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  breakdownGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  repaidValue: {
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  infoValueOverdue: {
    color: Colors.danger,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  notesSection: {
    gap: 4,
  },
  notesBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  receiptInfo: {
    flex: 1,
  },
  viewReceiptLink: {
    marginTop: 4,
  },
  viewReceiptText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  repayButton: {
    marginBottom: Spacing.xl,
  },
  completedNotice: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: 6,
  },
  completedNoticeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  completedNoticeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  historySection: {
    marginTop: Spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  noRepaymentsBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  noRepaymentsText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginRight: Spacing.sm,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  timelineNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
