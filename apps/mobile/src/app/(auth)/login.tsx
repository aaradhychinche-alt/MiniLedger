import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowRight, RotateCcw, KeyRound } from 'lucide-react-native';
import { Colors, Radii, Shadows, Spacing } from '../../constants/theme';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

export default function LoginScreen() {
  const { login } = useAuth();

  // State
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState<string>('9876543210');
  const [otp, setOtp] = useState<string>('');
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Resend countdown timer
  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post<{
        phoneNumber: string;
        maskedPhoneNumber: string;
        expiresInMinutes: number;
        message: string;
      }>('/auth/send-otp', { phoneNumber: phone.trim() });

      setMaskedPhone(res.maskedPhoneNumber);
      setStep('OTP');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post<{
        token: string;
        user: User;
      }>('/auth/verify-otp', {
        phoneNumber: phone.trim(),
        otp: otp.trim(),
      });

      await login(res.token, res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    await handleSendOtp();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={[styles.brandIconCircle, Shadows.card]}>
              <ShieldCheck size={36} color={Colors.primary} />
            </View>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.brandSubtitle}>
              Track money lent to friends & record repayments seamlessly
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, Shadows.elevated]}>
            {step === 'PHONE' ? (
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Sign In / Register</Text>
                  <Text style={styles.cardDescription}>
                    Enter your 10-digit Indian phone number to receive a verification OTP.
                  </Text>
                </View>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <FormField
                  label="Phone Number"
                  prefix="+91"
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    setErrorMessage(null);
                  }}
                  helperText="Enter 10-digit mobile number"
                />

                <PrimaryButton
                  title={isLoading ? 'Sending OTP...' : 'Send OTP'}
                  onPress={handleSendOtp}
                  isLoading={isLoading}
                  icon={<ArrowRight size={18} color={Colors.textInverse} />}
                  size="lg"
                  style={styles.actionButton}
                />

                {/* Quick Demo Fill */}
                <TouchableOpacity
                  style={styles.demoFillButton}
                  onPress={() => setPhone('9876543210')}
                >
                  <Text style={styles.demoFillText}>
                    Use Demo Account (+91 9876543210)
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Enter 6-Digit OTP</Text>
                  <Text style={styles.cardDescription}>
                    Sent to {maskedPhone || `+91 ${phone}`}
                  </Text>
                </View>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <FormField
                  label="Verification Code"
                  placeholder="••••••"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val);
                    setErrorMessage(null);
                  }}
                  style={styles.otpInput}
                />

                <PrimaryButton
                  title={isLoading ? 'Verifying...' : 'Verify & Continue'}
                  onPress={handleVerifyOtp}
                  isLoading={isLoading}
                  icon={<KeyRound size={18} color={Colors.textInverse} />}
                  size="lg"
                  style={styles.actionButton}
                />

                {/* Resend & Change Phone Actions */}
                <View style={styles.otpFooter}>
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    style={styles.resendButton}
                  >
                    <RotateCcw size={14} color={resendCooldown > 0 ? Colors.textMuted : Colors.primary} />
                    <Text
                      style={[
                        styles.resendText,
                        resendCooldown > 0 && styles.resendTextDisabled,
                      ]}
                    >
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setStep('PHONE');
                      setOtp('');
                      setErrorMessage(null);
                    }}
                  >
                    <Text style={styles.changePhoneText}>Change Number</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Dev Mode Helper Notice */}
          <View style={styles.devNotice}>
            <Text style={styles.devNoticeTitle}>🔧 DEVELOPER NOTICE</Text>
            <Text style={styles.devNoticeBody}>
              This app uses mock OTP verification. The 6-digit OTP code is logged directly to your
              backend server terminal console when you tap &quot;Send OTP&quot;.
            </Text>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  brandIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
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
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: Spacing.xs,
  },
  demoFillButton: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  demoFillText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.textMuted,
  },
  changePhoneText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  devNotice: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  devNoticeBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
