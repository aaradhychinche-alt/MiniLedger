import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { normalizeIndianPhoneNumber, maskPhoneNumber } from '../../utils/phone';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

function hashOtp(otp: string): string {
  return crypto
    .createHash('sha256')
    .update(otp + env.JWT_SECRET)
    .digest('hex');
}

export class AuthService {
  /**
   * Generates a 6-digit OTP, stores hashed record with expiry, and logs to dev console
   */
  static async sendOtp(phoneInput: string) {
    const normalizedPhone = normalizeIndianPhoneNumber(phoneInput);
    if (!normalizedPhone) {
      throw new AppError('Invalid Indian mobile phone number', 400);
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing unconsumed OTP challenges for this phone
    await prisma.otpChallenge.updateMany({
      where: {
        phoneNumber: normalizedPhone,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    // Create new OTP challenge
    await prisma.otpChallenge.create({
      data: {
        phoneNumber: normalizedPhone,
        codeHash,
        expiresAt,
      },
    });

    // Dev server log
    const masked = maskPhoneNumber(normalizedPhone);
    logger.otp(masked, otp);

    return {
      phoneNumber: normalizedPhone,
      maskedPhoneNumber: masked,
      expiresInMinutes: env.OTP_EXPIRY_MINUTES,
      message: 'OTP has been generated. Check backend server console for the code in development mode.',
    };
  }

  /**
   * Verifies submitted OTP, enforces attempts and expiry, consumes OTP, and creates/retrieves user
   */
  static async verifyOtp(phoneInput: string, otp: string) {
    const normalizedPhone = normalizeIndianPhoneNumber(phoneInput);
    if (!normalizedPhone) {
      throw new AppError('Invalid Indian mobile phone number', 400);
    }

    // Find the latest active OTP challenge
    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new AppError('No active OTP challenge found. Please request a new OTP.', 400);
    }

    // Check expiration
    if (new Date() > challenge.expiresAt) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Check attempt count
    if (challenge.attemptCount >= env.OTP_MAX_ATTEMPTS) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
    }

    // Verify hash
    const inputHash = hashOtp(otp);
    if (inputHash !== challenge.codeHash) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } },
      });
      const remainingAttempts = env.OTP_MAX_ATTEMPTS - (challenge.attemptCount + 1);
      throw new AppError(
        `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}`,
        400
      );
    }

    // Invalidate/consume the OTP challenge
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    // Create or find user
    const user = await prisma.user.upsert({
      where: { phoneNumber: normalizedPhone },
      update: {},
      create: {
        phoneNumber: normalizedPhone,
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        createdAt: true,
      },
    });

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user,
    };
  }

  /**
   * Retrieves authenticated user's profile
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}
