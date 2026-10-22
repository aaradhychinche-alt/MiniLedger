import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlusCircle } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';

interface SummaryCardProps {
  outstandingAmountFormatted: string;
  activeLoanCount: number;
  onAddLoanPress: () => void;
}

export function SummaryCard({
  outstandingAmountFormatted,
  activeLoanCount,
  onAddLoanPress,
}: SummaryCardProps) {
  return (
    <View style={[styles.container, Shadows.elevated]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>OUTSTANDING MONEY</Text>
          <Text style={styles.amount}>{outstandingAmountFormatted}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddLoanPress}
          activeOpacity={0.8}
        >
          <PlusCircle size={18} color={Colors.textInverse} />
          <Text style={styles.addButtonText}>Add Loan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activeCountText}>
            {activeLoanCount} active {activeLoanCount === 1 ? 'loan' : 'loans'} to collect
          </Text>
        </View>
        <Text style={styles.tapTip}>Tap to manage & track</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A', // Deep Charcoal / Navy fintech hero
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    gap: 6,
  },
  addButtonText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // vibrant emerald indicator
  },
  activeCountText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  tapTip: {
    color: '#64748B',
    fontSize: 12,
  },
});
