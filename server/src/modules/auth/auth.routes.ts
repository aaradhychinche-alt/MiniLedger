import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { sendOtpSchema, verifyOtpSchema } from './auth.schema';
import { otpSendLimiter, otpVerifyLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth';

const router = Router();

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  otpSendLimiter,
  validate(sendOtpSchema),
  AuthController.sendOtp
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  validate(verifyOtpSchema),
  AuthController.verifyOtp
);

// GET /api/auth/me (protected)
router.get(
  '/me',
  authenticate,
  AuthController.me
);

export const authRoutes = router;
