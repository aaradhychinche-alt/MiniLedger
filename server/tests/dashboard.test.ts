import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { env } from '../src/config/env';

const app = createApp();

describe('Dashboard Summary Endpoints', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { phoneNumber: '+919999900003', name: 'Dashboard Test User' },
    });
    userId = user.id;
    userToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      env.JWT_SECRET
    );
  });

  beforeEach(async () => {
    await prisma.repayment.deleteMany();
    await prisma.loan.deleteMany();
  });

  it('should calculate accurate dashboard metrics for various loan states', async () => {
    const now = new Date();
    const daysFromNow = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };

    // 1. Active Loan (5000, 0 repaid, due in 5 days)
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Friend A',
        amount: 5000,
        dueDate: daysFromNow(5),
      },
    });

    // 2. Overdue Loan (4000, 0 repaid, due 5 days ago)
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Friend B',
        amount: 4000,
        dueDate: daysFromNow(-5),
      },
    });

    // 3. Partially Repaid Active Loan (6000, 2000 repaid, due in 3 days)
    const partialLoan = await prisma.loan.create({
      data: {
        userId,
        friendName: 'Friend C',
        amount: 6000,
        dueDate: daysFromNow(3),
        repayments: {
          create: [{ amount: 2000 }],
        },
      },
    });

    // 4. Fully Repaid Loan (3000, 3000 repaid, due 10 days ago)
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Friend D',
        amount: 3000,
        dueDate: daysFromNow(-10),
        repayments: {
          create: [{ amount: 3000 }],
        },
      },
    });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const summary = res.body.data.summary;

    // Total Lent = 5000 + 4000 + 6000 + 3000 = 18000
    expect(summary.totalLent).toBe(18000);

    // Total Repaid = 0 + 0 + 2000 + 3000 = 5000
    expect(summary.totalRepaid).toBe(5000);

    // Outstanding = 5000 + 4000 + 4000 + 0 = 13000
    expect(summary.outstandingAmount).toBe(13000);

    // Overdue = Friend B (4000). Friend D is repaid so 0 overdue.
    expect(summary.overdueAmount).toBe(4000);

    // Active loans = 3 (Friend A, Friend B, Friend C)
    expect(summary.activeLoanCount).toBe(3);

    // Overdue loans = 1 (Friend B)
    expect(summary.overdueLoanCount).toBe(1);

    // Fully repaid loans = 1 (Friend D)
    expect(summary.fullyRepaidLoanCount).toBe(1);

    // Total loans = 4
    expect(summary.totalLoanCount).toBe(4);
  });
});
