import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, Plus } from 'lucide-react-native';
import { Colors, Radii, Spacing } from '../../constants/theme';
import { useLoansList } from '../../hooks/useLoans';
import { LoanCard } from '../../components/LoanCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

export default function LoansListScreen() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'repaid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    data: loans,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useLoansList(statusFilter, searchQuery.trim() || undefined);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>All Loans</Text>
          <Text style={styles.headerSubtitle}>
            {loans ? `${loans.length} loans tracked` : 'Tracked friend ledgers'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/loans/new')}
          activeOpacity={0.8}
        >
          <Plus size={18} color={Colors.textInverse} />
          <Text style={styles.addButtonText}>Add Loan</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            placeholder="Search by friend's name..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'overdue', 'repaid'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              statusFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <ErrorState
          title="Could not load loans"
          message={error instanceof Error ? error.message : 'Error fetching loan list'}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : (
        <FlatList
          data={loans || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onPress={() => router.push(`/loans/${item.id}` as any)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No loans found"
              description={
                searchQuery
                  ? `No loans matching "${searchQuery}" in ${statusFilter} loans.`
                  : `No loans found in the "${statusFilter}" list.`
              }
              actionTitle="Add New Loan"
              onActionPress={() => router.push('/loans/new')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    gap: 6,
  },
  addButtonText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
});
