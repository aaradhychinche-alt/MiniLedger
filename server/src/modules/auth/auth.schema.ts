import { z } from 'zod';
import { normalizeIndianPhoneNumber } from '../../utils/phone';

export const sendOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .refine((val) => normalizeIndianPhoneNumber(val) !== null, {
        message: 'Must be a valid 10-digit Indian mobile number (e.g., 9876543210 or +919876543210)',
      }),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .refine((val) => normalizeIndianPhoneNumber(val) !== null, {
        message: 'Must be a valid Indian mobile number',
      }),
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
  }),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>['body'];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>['body'];
