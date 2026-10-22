import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';

interface MetricCardProps {
  label: string;
  amount: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'danger';
}

export function MetricCard({
  label,
  amount,
  subtitle,
  icon,
  variant = 'default',
}: MetricCardProps) {
  const getAccentColor = () => {
    switch (variant) {
      case 'success':
        return Colors.primary;
      case 'danger':
        return Colors.danger;
      case 'default':
      default:
        return Colors.text;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return Colors.card;
      case 'danger':
        return '#FFF5F5';
      case 'default':
      default:
        return Colors.card;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'danger':
        return Colors.dangerBorder;
      case 'success':
        return Colors.border;
      case 'default':
      default:
        return Colors.border;
    }
  };

  return (
    <View
      style={[
        styles.container,
        Shadows.card,
        { backgroundColor: getBackgroundColor(), borderColor: getBorderColor() },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={[styles.amount, { color: getAccentColor() }]} numberOfLines={1}>
        {amount}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  iconContainer: {
    marginLeft: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginVertical: 2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
