import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LogOut,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Radii, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { SummaryCard } from '../../components/SummaryCard';
import { MetricCard } from '../../components/MetricCard';
import { LoanCard } from '../../components/LoanCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Loan } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: summary, isLoading, error, refetch, isRefetching } = useDashboardSummary();

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'overdue' | 'repaid'>('all');

  const handleLogout = () => {
    const doLogout = () => logout();

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of MiniLedger?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  // Filter recent loans
  const getFilteredRecentLoans = (): Loan[] => {
    if (!summary?.recentLoans) return [];
    switch (activeFilter) {
      case 'active':
        return summary.recentLoans.filter((l) => l.remainingBalance > 0);
      case 'overdue':
        return summary.recentLoans.filter((l) => l.isOverdue);
      case 'repaid':
        return summary.recentLoans.filter((l) => l.status === 'REPAID');
      case 'all':
      default:
        return summary.recentLoans;
    }
  };

  const filteredRecent = getFilteredRecentLoans();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Top Bar: Profile & Logout */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.profileText}>
              {user?.name || user?.phoneNumber || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={16} color={Colors.textSecondary} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.skeletonWrapper}>
            <LoadingSkeleton count={3} />
          </View>
        ) : error ? (
          <ErrorState
            title="Failed to load dashboard"
            message={error instanceof Error ? error.message : 'Unable to connect to server'}
            onRetry={refetch}
            isRetrying={isRefetching}
          />
        ) : summary ? (
          <>
            {/* Main Summary Card */}
            <SummaryCard
              outstandingAmountFormatted={summary.outstandingAmountFormatted}
              activeLoanCount={summary.activeLoanCount}
              onAddLoanPress={() => router.push('/loans/new')}
            />

            {/* Metric Cards Row */}
            <View style={styles.metricsRow}>
              <MetricCard
                label="Total Lent"
                amount={summary.totalLentFormatted}
                subtitle={`${summary.totalLoanCount} total`}
                icon={<TrendingUp size={16} color={Colors.textSecondary} />}
              />
              <MetricCard
                label="Total Repaid"
                amount={summary.totalRepaidFormatted}
                subtitle={`${summary.fullyRepaidLoanCount} settled`}
                variant="success"
                icon={<CheckCircle2 size={16} color={Colors.primary} />}
              />
              <MetricCard
                label="Overdue"
                amount={summary.overdueAmountFormatted}
                subtitle={`${summary.overdueLoanCount} overdue`}
                variant="danger"
                icon={<AlertTriangle size={16} color={Colors.danger} />}
              />
            </View>

            {/* Recent Loans Section */}
            <View style={styles.recentSectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Loans</Text>
                <Text style={styles.sectionSubtitle}>Latest lent items & payments</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/(tabs)/loans')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ArrowRight size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsRow}>
              {(['all', 'active', 'overdue', 'repaid'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterTab,
                    activeFilter === filter && styles.filterTabActive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      activeFilter === filter && styles.filterTabTextActive,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Loans List or Empty State */}
            {filteredRecent.length === 0 ? (
              <EmptyState
                title="No loans found"
                description={
                  activeFilter === 'all'
                    ? "You haven't recorded any loans yet. Tap below to track money lent to a friend."
                    : `No loans found in the "${activeFilter}" category.`
                }
                actionTitle="Add New Loan"
                onActionPress={() => router.push('/loans/new')}
              />
            ) : (
              filteredRecent.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onPress={() => router.push(`/loans/${loan.id}` as any)}
                />
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  profileText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  skeletonWrapper: {
    marginTop: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textInverse,
  },
});
