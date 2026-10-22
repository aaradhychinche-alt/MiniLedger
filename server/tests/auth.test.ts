import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import crypto from 'crypto';
import { env } from '../src/config/env';

const app = createApp();

describe('Authentication Endpoints', () => {
  const testPhone = '9876543210';
  const normalizedPhone = '+919876543210';

  beforeEach(async () => {
    await prisma.otpChallenge.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should generate and store OTP for a valid Indian phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneNumber).toBe(normalizedPhone);
      expect(res.body.data.maskedPhoneNumber).toContain('******');

      // Verify DB record
      const challenge = await prisma.otpChallenge.findFirst({
        where: { phoneNumber: normalizedPhone },
      });
      expect(challenge).not.toBeNull();
      expect(challenge?.codeHash).toBeDefined();
      expect(challenge?.consumedAt).toBeNull();
    });

    it('should reject invalid phone numbers', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should successfully verify a correct OTP and return JWT token and user profile', async () => {
      const rawOtp = '654321';
      const codeHash = crypto
        .createHash('sha256')
        .update(rawOtp + env.JWT_SECRET)
        .digest('hex');

      await prisma.otpChallenge.create({
        data: {
          phoneNumber: normalizedPhone,
          codeHash,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: rawOtp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.phoneNumber).toBe(normalizedPhone);

      // Verify challenge consumed
      const challenge = await prisma.otpChallenge.findFirst({
        where: { phoneNumber: normalizedPhone },
      });
      expect(challenge?.consumedAt).not.toBeNull();
    });

    it('should reject an incorrect OTP and track attempt count', async () => {
      const rawOtp = '654321';
      const codeHash = crypto
        .createHash('sha256')
        .update(rawOtp + env.JWT_SECRET)
        .digest('hex');

      await prisma.otpChallenge.create({
        data: {
          phoneNumber: normalizedPhone,
          codeHash,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: '111111' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid OTP');

      const challenge = await prisma.otpChallenge.findFirst({
        where: { phoneNumber: normalizedPhone },
      });
      expect(challenge?.attemptCount).toBe(1);
    });

    it('should reject an expired OTP', async () => {
      const rawOtp = '654321';
      const codeHash = crypto
        .createHash('sha256')
        .update(rawOtp + env.JWT_SECRET)
        .digest('hex');

      await prisma.otpChallenge.create({
        data: {
          phoneNumber: normalizedPhone,
          codeHash,
          expiresAt: new Date(Date.now() - 1000), // expired 1s ago
        },
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: testPhone, otp: rawOtp });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile for authenticated user', async () => {
      // Create user
      const user = await prisma.user.create({
        data: { phoneNumber: normalizedPhone, name: 'Test User' },
      });

      // Generate JWT
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: user.id, phoneNumber: user.phoneNumber },
        env.JWT_SECRET
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user.phoneNumber).toBe(normalizedPhone);
    });

    it('should reject request without authentication token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
