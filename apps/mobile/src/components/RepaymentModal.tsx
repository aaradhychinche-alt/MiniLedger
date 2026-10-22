import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { X, CheckCircle } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing, formatINR } from '../constants/theme';
import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';

interface RepaymentModalProps {
  visible: boolean;
  onClose: () => void;
  friendName: string;
  remainingBalance: number;
  remainingBalanceFormatted: string;
  onSubmit: (amount: number, notes?: string) => Promise<void>;
  isLoading: boolean;
}

export function RepaymentModal({
  visible,
  onClose,
  friendName,
  remainingBalance,
  remainingBalanceFormatted,
  onSubmit,
  isLoading,
}: RepaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectFull = () => {
    setAmount(remainingBalance.toString());
    setError(null);
  };

  const handleSelectHalf = () => {
    const half = Math.round(remainingBalance / 2);
    setAmount(half.toString());
    setError(null);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid repayment amount greater than 0');
      return;
    }

    if (numAmount > remainingBalance) {
      setError(`Amount cannot exceed the remaining balance of ${remainingBalanceFormatted}`);
      return;
    }

    setError(null);

    // Confirmation
    const proceed = () => {
      onSubmit(numAmount, notes.trim() || undefined);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Confirm recording a repayment of ${formatINR(numAmount)} from ${friendName}?`
      );
      if (confirmed) proceed();
    } else {
      Alert.alert(
        'Confirm Repayment',
        `Record repayment of ${formatINR(numAmount)} from ${friendName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'default', onPress: proceed },
        ]
      );
    }
  };

  const handleClose = () => {
    setAmount('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={[styles.modalCard, Shadows.elevated]}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Record Repayment</Text>
                  <Text style={styles.subtitle}>From {friendName}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  disabled={isLoading}
                >
                  <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Balance Banner */}
              <View style={styles.balanceBanner}>
                <Text style={styles.balanceLabel}>CURRENT OUTSTANDING</Text>
                <Text style={styles.balanceAmount}>{remainingBalanceFormatted}</Text>
              </View>

              {/* Quick Amount Selection Chips */}
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    amount === remainingBalance.toString() && styles.chipActive,
                  ]}
                  onPress={handleSelectFull}
                >
                  <Text
                    style={[
                      styles.chipText,
                      amount === remainingBalance.toString() && styles.chipTextActive,
                    ]}
                  >
                    Full ({remainingBalanceFormatted})
                  </Text>
                </TouchableOpacity>

                {remainingBalance > 100 && (
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      amount === Math.round(remainingBalance / 2).toString() && styles.chipActive,
                    ]}
                    onPress={handleSelectHalf}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        amount === Math.round(remainingBalance / 2).toString() && styles.chipTextActive,
                      ]}
                    >
                      50% ({formatINR(remainingBalance / 2)})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Amount Input */}
              <FormField
                label="Repayment Amount (₹)"
                prefix="₹"
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setError(null);
                }}
                error={error || undefined}
              />

              {/* Notes Input */}
              <FormField
                label="Notes (Optional)"
                placeholder="e.g. UPI transfer, Cash, GPay ref"
                value={notes}
                onChangeText={setNotes}
              />

              {/* Submit Button */}
              <PrimaryButton
                title={isLoading ? 'Recording Repayment...' : 'Confirm & Save Repayment'}
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={isLoading}
                icon={<CheckCircle size={18} color={Colors.textInverse} />}
                style={styles.submitButton}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl : Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  balanceBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
});
