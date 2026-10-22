import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  X,
  Check,
} from 'lucide-react-native';
import { Colors, Radii, Spacing } from '../../constants/theme';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useCreateLoan } from '../../hooks/useLoans';
import { apiClient } from '../../lib/api';

const createLoanFormSchema = z.object({
  friendName: z.string().trim().min(1, "Friend's name is required").max(100),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be greater than ₹0',
    }),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Please enter a valid date (YYYY-MM-DD)',
    }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type FormValues = z.infer<typeof createLoanFormSchema>;

export default function NewLoanScreen() {
  const router = useRouter();
  const createLoanMutation = useCreateLoan();

  // Receipt image state
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  // Default due date: 7 days from today
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createLoanFormSchema),
    defaultValues: {
      friendName: '',
      amount: '',
      dueDate: defaultDueDate(),
      notes: '',
    },
  });

  // Pick receipt image
  const handlePickReceipt = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access photos is needed to upload receipts.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setReceiptUri(asset.uri);

        // Upload to backend
        setIsUploadingReceipt(true);
        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        if (Platform.OS === 'web') {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          formData.append('receipt', blob, filename);
        } else {
          formData.append('receipt', {
            uri: asset.uri,
            name: filename,
            type,
          } as any);
        }

        const uploadRes = await apiClient.upload<{ url: string }>('/receipts/upload', formData);
        setReceiptUrl(uploadRes.url);
      }
    } catch (err: any) {
      console.error('Failed to upload receipt:', err);
      Alert.alert('Upload Failed', err.message || 'Unable to upload receipt image.');
      setReceiptUri(null);
      setReceiptUrl(null);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUri(null);
    setReceiptUrl(null);
  };

  const onSubmit = async (values: FormValues) => {
    setApiErrorMessage(null);
    try {
      await createLoanMutation.mutateAsync({
        friendName: values.friendName.trim(),
        amount: parseFloat(values.amount),
        dueDate: new Date(values.dueDate).toISOString(),
        notes: values.notes?.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
      });

      // Navigate back on success
      router.back();
    } catch (err: any) {
      setApiErrorMessage(err.message || 'Failed to create loan. Please check your inputs.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Add New Loan</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {apiErrorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{apiErrorMessage}</Text>
            </View>
          )}

          {/* Friend Name */}
          <Controller
            control={control}
            name="friendName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Friend's Full Name *"
                placeholder="e.g. Rohan Sharma"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.friendName?.message}
              />
            )}
          />

          {/* Amount Lent */}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Amount Lent (₹) *"
                prefix="₹"
                placeholder="5000"
                keyboardType="numeric"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.amount?.message}
                helperText="Enter the total principal amount lent"
              />
            )}
          />

          {/* Due Date */}
          <Controller
            control={control}
            name="dueDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Due Date (YYYY-MM-DD) *"
                placeholder="2026-10-30"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.dueDate?.message}
                helperText="When is the friend expected to repay this loan?"
              />
            )}
          />

          {/* Quick Date Helpers */}
          <View style={styles.quickDatesRow}>
            <Text style={styles.quickDateLabel}>Quick Due Date:</Text>
            {[
              { label: '+1 Week', days: 7 },
              { label: '+2 Weeks', days: 14 },
              { label: '+1 Month', days: 30 },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickDateChip}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + item.days);
                  setValue('dueDate', d.toISOString().split('T')[0]);
                }}
              >
                <Text style={styles.quickDateText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Reason / Notes (Optional)"
                placeholder="e.g. Weekend dinner split, emergency cash"
                value={value || ''}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                error={errors.notes?.message}
              />
            )}
          />

          {/* Receipt Image Picker */}
          <View style={styles.receiptSection}>
            <Text style={styles.receiptLabel}>Receipt / Proof Photo (Optional)</Text>
            {receiptUri ? (
              <View style={styles.receiptPreviewContainer}>
                <Image source={{ uri: receiptUri }} style={styles.receiptThumbnail} />
                <View style={styles.receiptInfo}>
                  <Text style={styles.receiptSuccessText}>
                    {isUploadingReceipt ? 'Uploading receipt...' : 'Receipt attached'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleRemoveReceipt}
                    style={styles.removeReceiptButton}
                  >
                    <X size={14} color={Colors.danger} />
                    <Text style={styles.removeReceiptText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handlePickReceipt}
                disabled={isUploadingReceipt}
                activeOpacity={0.8}
              >
                <Camera size={24} color={Colors.primary} />
                <Text style={styles.uploadBoxText}>
                  {isUploadingReceipt ? 'Uploading...' : 'Attach Receipt or UPI Screenshot'}
                </Text>
                <Text style={styles.uploadBoxSubtext}>PNG, JPG, or WebP up to 5MB</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <PrimaryButton
            title={isSubmitting || createLoanMutation.isPending ? 'Saving Loan...' : 'Save & Track Loan'}
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting || createLoanMutation.isPending}
            disabled={isSubmitting || createLoanMutation.isPending || isUploadingReceipt}
            size="lg"
            icon={<Check size={18} color={Colors.textInverse} />}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: 6,
    borderRadius: Radii.full,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  quickDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  quickDateLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 4,
  },
  quickDateChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  receiptSection: {
    marginBottom: Spacing.xl,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderDark,
    borderRadius: Radii.lg,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadBoxText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  uploadBoxSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  receiptThumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radii.md,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptSuccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  removeReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  removeReceiptText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
