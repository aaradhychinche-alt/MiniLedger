import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { env } from '../src/config/env';

const app = createApp();

describe('Loans Endpoints', () => {
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    // Create test user 1
    const user1 = await prisma.user.create({
      data: { phoneNumber: '+919999900001', name: 'User One' },
    });
    userId = user1.id;
    userToken = jwt.sign(
      { userId: user1.id, phoneNumber: user1.phoneNumber },
      env.JWT_SECRET
    );

    // Create test user 2 (for multi-tenant isolation tests)
    const user2 = await prisma.user.create({
      data: { phoneNumber: '+919999900002', name: 'User Two' },
    });
    otherUserId = user2.id;
    otherUserToken = jwt.sign(
      { userId: user2.id, phoneNumber: user2.phoneNumber },
      env.JWT_SECRET
    );
  });

  beforeEach(async () => {
    await prisma.repayment.deleteMany();
    await prisma.loan.deleteMany();
  });

  describe('POST /api/loans', () => {
    it('should create a loan with valid data and initial PENDING status', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Aman Gupta',
          amount: 5000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Concert pass split',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loan.friendName).toBe('Aman Gupta');
      expect(res.body.data.loan.amount).toBe(5000);
      expect(res.body.data.loan.amountRepaid).toBe(0);
      expect(res.body.data.loan.remainingBalance).toBe(5000);
      expect(res.body.data.loan.status).toBe('PENDING');
      expect(res.body.data.loan.isOverdue).toBe(false);
    });

    it('should reject loan with non-positive amount', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Aman Gupta',
          amount: 0,
          dueDate: new Date().toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/loans', () => {
    it('should list only loans belonging to the authenticated user', async () => {
      // Create loan for User 1
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Friend 1',
          amount: 2000,
          dueDate: new Date().toISOString(),
        });

      // Create loan for User 2
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          friendName: 'Friend Other',
          amount: 3000,
          dueDate: new Date().toISOString(),
        });

      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.loans).toHaveLength(1);
      expect(res.body.data.loans[0].friendName).toBe('Friend 1');
    });

    it('should support search by friend name', async () => {
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Rahul Dravid',
          amount: 4000,
          dueDate: new Date().toISOString(),
        });

      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Sachin Tendulkar',
          amount: 6000,
          dueDate: new Date().toISOString(),
        });

      const res = await request(app)
        .get('/api/loans?search=Rahul')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.loans).toHaveLength(1);
      expect(res.body.data.loans[0].friendName).toBe('Rahul Dravid');
    });
  });

  describe('PATCH /api/loans/:id/repay', () => {
    it('should record partial repayment and update remaining balance', async () => {
      // Create loan
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Neha Sharma',
          amount: 10000,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        });

      const loanId = createRes.body.data.loan.id;

      // Partial repayment
      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 4000,
          notes: 'First installment',
        });

      expect(repayRes.status).toBe(200);
      expect(repayRes.body.data.loan.amountRepaid).toBe(4000);
      expect(repayRes.body.data.loan.remainingBalance).toBe(6000);
      expect(repayRes.body.data.loan.status).toBe('PARTIALLY_REPAID');
      expect(repayRes.body.data.loan.repayments).toHaveLength(1);
    });

    it('should reject repayment exceeding remaining balance', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Neha Sharma',
          amount: 5000,
          dueDate: new Date().toISOString(),
        });

      const loanId = createRes.body.data.loan.id;

      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 6000 });

      expect(repayRes.status).toBe(400);
      expect(repayRes.body.message).toContain('exceeds remaining balance');
    });

    it('should mark loan as REPAID when fully paid and disallow further repayments', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Karan Mehra',
          amount: 3000,
          dueDate: new Date().toISOString(),
        });

      const loanId = createRes.body.data.loan.id;

      // Full repayment
      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 3000 });

      expect(repayRes.status).toBe(200);
      expect(repayRes.body.data.loan.remainingBalance).toBe(0);
      expect(repayRes.body.data.loan.status).toBe('REPAID');

      // Attempt to repay again
      const overRepayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 500 });

      expect(overRepayRes.status).toBe(400);
      expect(overRepayRes.body.message).toContain('already been fully repaid');
    });

    it('should prevent user from repaying another user loan', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'Private Loan',
          amount: 5000,
          dueDate: new Date().toISOString(),
        });

      const loanId = createRes.body.data.loan.id;

      // User 2 tries to repay User 1's loan
      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ amount: 1000 });

      expect(repayRes.status).toBe(404);
    });
  });

  describe('DELETE /api/loans/:id', () => {
    it('should delete a loan and its repayments', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          friendName: 'To Delete',
          amount: 2500,
          dueDate: new Date().toISOString(),
        });

      const loanId = createRes.body.data.loan.id;

      const deleteRes = await request(app)
        .delete(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
