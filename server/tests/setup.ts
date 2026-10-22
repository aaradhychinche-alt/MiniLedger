import dotenv from 'dotenv';
import path from 'path';

// Force test environment
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from '../src/config/database';

beforeAll(async () => {
  // Clear test database tables before running tests
  await prisma.repayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.repayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
