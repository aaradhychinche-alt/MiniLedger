import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MiniLedger database seed...');

  // Demo user phone
  const demoPhone = '+919876543210';

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { phoneNumber: demoPhone },
    update: { name: 'Aaradhy Chinche' },
    create: {
      phoneNumber: demoPhone,
      name: 'Aaradhy Chinche',
    },
  });

  console.log(`👤 Seeded User: ${user.name} (${user.phoneNumber}) [ID: ${user.id}]`);

  // Clear existing loans for demo user to ensure idempotent seed
  await prisma.loan.deleteMany({
    where: { userId: user.id },
  });

  const now = new Date();

  // Helper date generators
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // 1. Active Loan (Pending, due in 7 days)
  const activeLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Rohan Sharma',
      amount: new Prisma.Decimal(10000),
      dueDate: daysFromNow(7),
      notes: 'Goa road trip advance booking split',
      createdAt: daysFromNow(-3),
    },
  });
  console.log(`✅ Created Active Loan: ${activeLoan.friendName} - ₹10,000 (Due in 7 days)`);

  // 2. Overdue Loan (Unpaid, due 8 days ago)
  const overdueLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Priya Patel',
      amount: new Prisma.Decimal(8000),
      dueDate: daysFromNow(-8),
      notes: 'Coldplay concert VIP ticket payment',
      createdAt: daysFromNow(-20),
    },
  });
  console.log(`⚠️ Created Overdue Loan: ${overdueLoan.friendName} - ₹8,000 (Due 8 days ago)`);

  // 3. Partially Repaid Loan (Active, due tomorrow)
  const partialActiveLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Vikram Malhotra',
      amount: new Prisma.Decimal(15000),
      dueDate: daysFromNow(1),
      notes: 'MacBook display repair emergency loan',
      createdAt: daysFromNow(-14),
      repayments: {
        create: [
          {
            amount: new Prisma.Decimal(5000),
            notes: 'First installment paid via UPI',
            createdAt: daysFromNow(-4),
          },
        ],
      },
    },
  });
  console.log(
    `✅ Created Partially Repaid Active Loan: ${partialActiveLoan.friendName} - ₹15,000 (Repaid ₹5,000, Due tomorrow)`
  );

  // 4. Partially Repaid & Overdue Loan (Due 5 days ago)
  const partialOverdueLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Ananya Desai',
      amount: new Prisma.Decimal(12000),
      dueDate: daysFromNow(-5),
      notes: 'Diwali shopping group expenses',
      createdAt: daysFromNow(-18),
      repayments: {
        create: [
          {
            amount: new Prisma.Decimal(4000),
            notes: 'Cash payment received',
            createdAt: daysFromNow(-6),
          },
        ],
      },
    },
  });
  console.log(
    `⚠️ Created Partially Repaid Overdue Loan: ${partialOverdueLoan.friendName} - ₹12,000 (Repaid ₹4,000, Due 5 days ago)`
  );

  // 5. Fully Repaid Loan (Due 14 days ago, repaid in full)
  const repaidLoan = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Sameer Verma',
      amount: new Prisma.Decimal(4500),
      dueDate: daysFromNow(-14),
      notes: 'Dinner celebration bill at Olive Bistro',
      createdAt: daysFromNow(-25),
      repayments: {
        create: [
          {
            amount: new Prisma.Decimal(2000),
            notes: 'Initial partial payment via PhonePe',
            createdAt: daysFromNow(-18),
          },
          {
            amount: new Prisma.Decimal(2500),
            notes: 'Final settlement paid in full via GPay',
            createdAt: daysFromNow(-12),
          },
        ],
      },
    },
  });
  console.log(
    `🎉 Created Fully Repaid Loan: ${repaidLoan.friendName} - ₹4,500 (Repaid ₹4,500 in full)`
  );

  console.log('✨ MiniLedger database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
