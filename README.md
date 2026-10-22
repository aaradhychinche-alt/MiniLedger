# MiniLedger — Full-Stack Loan & Repayment Tracker

MiniLedger is a production-minded, full-stack mobile MVP built for tracking money lent to friends and recording repayments with ease, transparency, and accuracy.

Designed with a modern fintech aesthetic (charcoal typography, emerald green accents, and subtle borders), it features a complete **React Native (Expo)** mobile application backed by a real **Node.js (Express + TypeScript)** server and a normalized **PostgreSQL** database managed via **Prisma ORM**.

---

## 📸 Screenshots & Highlights

- **Phone Number Authentication with Mock OTP**: Validates 10-digit Indian mobile numbers (`+91`), logs a cryptographically secure 6-digit OTP to the dev console, and stores a hashed challenge with expiry.
- **Fintech Dashboard**: Prominently displays Outstanding Balance, Total Lent, Total Repaid, and Overdue amounts calculated dynamically from PostgreSQL decimals.
- **Loan Management**: Create loans with friend names, amounts, due dates, notes, and receipt photos. Filter by status (`All`, `Active`, `Overdue`, `Repaid`) or search by friend name.
- **Transaction-Safe Repayments**: Record partial or full repayments with instant confirmation, live progress bars, and historical repayment timelines.
- **Receipt Uploads**: Optional receipt photos using Expo Image Picker uploaded as multipart form data.
- **Overdue Tracking**: Dynamic overdue evaluation based on the server's documented timezone (`Asia/Kolkata`), ensuring loans due today are not flagged until the next day.

---

## 🏗️ Repository Architecture

This repository is organized as a clean monorepo:

```text
MiniLedger/
├── apps/
│   └── mobile/                       # React Native (Expo) mobile client
│       ├── app.json                  # Expo configuration
│       ├── .env.example              # Mobile environment template
│       └── src/
│           ├── app/                  # Expo Router file-based screens
│           │   ├── _layout.tsx       # Root layout (QueryClient, AuthProvider)
│           │   ├── (auth)/login.tsx  # Phone & OTP verification screen
│           │   ├── (tabs)/
│           │   │   ├── _layout.tsx   # Bottom tab bar navigation
│           │   │   ├── index.tsx     # Dashboard & summary metrics
│           │   │   └── loans.tsx     # All loans list with search & filter
│           │   └── loans/
│           │       ├── new.tsx       # Add loan form with Zod validation
│           │       └── [id].tsx      # Loan details, history & repayment modal
│           ├── components/           # Reusable UI components
│           │   ├── SummaryCard.tsx   # Prominent hero balance card
│           │   ├── MetricCard.tsx    # Total Lent, Repaid, Overdue cards
│           │   ├── LoanCard.tsx      # Loan item with progress bar & overdue badge
│           │   ├── StatusBadge.tsx   # Loan status badge
│           │   ├── RepaymentModal.tsx# Bottom sheet / modal to record repayment
│           │   ├── ReceiptModal.tsx  # Full-screen receipt photo viewer
│           │   ├── FormField.tsx     # Validated input field
│           │   ├── PrimaryButton.tsx # Action buttons with loading states
│           │   ├── EmptyState.tsx    # Helpful empty state illustration
│           │   ├── ErrorState.tsx    # Network retry error component
│           │   └── LoadingSkeleton.tsx# Pulse skeleton loader
│           ├── context/
│           │   └── AuthContext.tsx   # Session management & route protection
│           ├── hooks/
│           │   ├── useLoans.ts       # React Query hooks for loan CRUD & repayments
│           │   └── useDashboard.ts   # React Query hook for dashboard summary
│           ├── lib/
│           │   ├── api.ts            # Centralized API client (JWT injection & handling)
│           │   └── queryClient.ts    # TanStack Query client configuration
│           ├── services/
│           │   └── storage.ts        # Expo SecureStore token persistence
│           ├── constants/
│           │   └── theme.ts          # Fintech colors, typography, currency formatters
│           └── types/
│               └── index.ts          # TypeScript interfaces
├── server/                           # Express.js + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma             # Normalized PostgreSQL schema
│   │   └── seed.ts                   # Database seed script with demo states
│   ├── src/
│   │   ├── config/                   # Typed environment & Prisma singleton
│   │   ├── middleware/               # Auth, validation, error handler, rate limiters
│   │   ├── modules/
│   │   │   ├── auth/                 # OTP generation, verification, me endpoint
│   │   │   ├── loans/                # Loan CRUD & transactional repayments
│   │   │   ├── dashboard/            # Financial summary aggregations
│   │   │   └── receipts/             # Multer multipart file upload handler
│   │   ├── routes/                   # API router mounting
│   │   ├── utils/                    # Phone normalizer, date, currency, logger
│   │   ├── app.ts                    # Express application factory
│   │   └── index.ts                  # Server entrypoint with graceful shutdown
│   ├── tests/                        # Jest + Supertest integration tests
│   │   ├── setup.ts                  # Test DB teardown and setup
│   │   ├── auth.test.ts              # Authentication test suite
│   │   ├── loans.test.ts             # Loan lifecycle & repayment test suite
│   │   └── dashboard.test.ts         # Aggregation metrics test suite
│   └── uploads/                      # Local uploaded receipt images
├── docker-compose.yml                # Local PostgreSQL 15 container definition
├── .env.example                      # Root environment template
└── package.json                      # Monorepo workspaces & convenience scripts
```

---

## 🛠️ Technology Stack

### Mobile Application
- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 58)
- **Language**: TypeScript (strict mode)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (v58 file-based routing)
- **State & Server Cache**: [@tanstack/react-query](https://tanstack.com/query) v5
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Security**: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) for hardware-backed JWT storage
- **Hardware Integration**: [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) for camera/gallery receipt capture
- **Icons**: [Lucide React Native](https://lucide.dev/)

### Backend Server
- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/) with TypeScript
- **Database & ORM**: [PostgreSQL 15](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT-based token signing and verification
- **Validation**: Zod schema middleware for request bodies, queries, and route params
- **Rate Limiting**: `express-rate-limit` for OTP throttling and API security
- **File Uploads**: `multer` with file size and MIME-type restrictions
- **Testing**: [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest)

---

## 🗄️ Database Model & Business Rules

### Prisma Schema (`schema.prisma`)

```prisma
model User {
  id          String   @id @default(uuid())
  phoneNumber String   @unique
  name        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  loans       Loan[]
}

model Loan {
  id          String      @id @default(uuid())
  userId      String
  friendName  String
  amount      Decimal     @db.Decimal(12, 2)
  dueDate     DateTime
  notes       String?     @db.Text
  receiptUrl  String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  repayments  Repayment[]

  @@index([userId])
  @@index([dueDate])
}

model Repayment {
  id        String   @id @default(uuid())
  loanId    String
  amount    Decimal  @db.Decimal(12, 2)
  notes     String?
  createdAt DateTime @default(now())
  loan      Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)

  @@index([loanId])
}

model OtpChallenge {
  id           String    @id @default(uuid())
  phoneNumber  String
  codeHash     String
  expiresAt    DateTime
  attemptCount Int       @default(0)
  consumedAt   DateTime?
  createdAt    DateTime  @default(now())

  @@index([phoneNumber])
}
```

### Business Rules
1. **Monetary Precision**: All financial amounts use PostgreSQL `DECIMAL(12, 2)` to avoid IEEE-754 floating-point inaccuracies. Amounts must be strictly greater than zero.
2. **Transaction-Safe Repayments**: Recording a repayment runs in a database transaction (`prisma.$transaction`). It computes the current balance from the loan principal and prior repayments.
3. **Repayment Boundaries**: A repayment cannot exceed the remaining balance. Once the balance hits `₹0`, the loan status transitions to `REPAID`, and further repayments are disallowed.
4. **Tenant Isolation**: Users can only inspect, modify, repay, or delete loans belonging to their authenticated user account.
5. **Overdue Calculation**: Loans are evaluated against the current date in the configured timezone (`Asia/Kolkata`). A loan due today is **not** overdue until the calendar day changes.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** running locally OR **Docker** installed

### 2. Clone and Setup Environment

```bash
git clone <repo-url>
cd MiniLedger

# Copy environment template for backend
cp .env.example server/.env

# Copy environment template for mobile app
cp apps/mobile/.env.example apps/mobile/.env
```

### 3. Start PostgreSQL Database

You can run PostgreSQL via Docker Compose:

```bash
docker compose up -d
```

*Or use an existing PostgreSQL instance on your system and set `DATABASE_URL` in `server/.env`.*

### 4. Install Dependencies, Migrate & Seed

```bash
# Install root, server, and mobile dependencies
npm install --prefix server
npm install --prefix apps/mobile

# Run Prisma migration to create tables
npm --prefix server run prisma:generate
npx --prefix server prisma db push

# Seed database with realistic demo loans in all states
npm run seed
```

> **Seeded Demo Account**:
> - Phone: `+91 9876543210`
> - Contains: Active loans, Overdue loans (Coldplay concert pass, Diwali shopping), Partially repaid loans (MacBook repair), and Settled loans.

---

## 🏃 Running the Application

### 1. Start the Backend Server

```bash
npm run dev:server
```

The server starts on `http://localhost:4000`.

### 2. Start the Mobile App

In a separate terminal:

```bash
npm run dev:mobile
```

Press:
- **`w`** to open in Web Browser (quickest desktop preview).
- **`i`** to open in iOS Simulator (macOS with Xcode).
- **`a`** to open in Android Emulator.
- Scan the QR code with **Expo Go** on your physical iOS or Android phone.

---

## 📱 Mobile Networking & Physical Phone Setup

When testing on a **physical device** or **Android emulator**, `localhost` points to the device itself, not your development computer:

1. **Physical Phone via Expo Go**:
   - Ensure your phone and development computer are connected to the **same Wi-Fi network**.
   - Find your computer's local IP address (`ipconfig` on Windows or `ifconfig` / `ipconfig getifaddr en0` on macOS).
   - In `apps/mobile/.env`, update:
     ```env
     EXPO_PUBLIC_API_URL=http://192.168.1.15:4000/api
     ```
   - Restart the Expo development server: `npm run dev:mobile -- -c`.

2. **Android Emulator**:
   - Android emulators access the host machine via `http://10.0.2.2:4000/api`.
   - Update `apps/mobile/.env`:
     ```env
     EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
     ```

3. **iOS Simulator & Web**:
   - Default `http://localhost:4000/api` works out of the box.

---

## 🔑 Authentication Workflow (Mock OTP)

MiniLedger uses a secure, mock OTP flow suitable for review and demonstration:

1. Enter your 10-digit Indian phone number (or tap **"Use Demo Account (+91 9876543210)"**).
2. Tap **"Send OTP"**.
3. Inspect your backend terminal console. A clear developer banner will show:
   ```text
   =========================================
   🔑 DEV OTP for +91 ******3210: >>> 828682 <<<
   (Valid for 5 minutes)
   =========================================
   ```
4. Enter the 6-digit code into the mobile app and tap **"Verify & Continue"**.
5. The issued JWT token is persisted securely in Expo SecureStore, and the user is taken directly to the dashboard.

---

## 🧪 Testing & Code Quality

### Run Backend Integration Tests

MiniLedger includes a comprehensive test suite written with Jest and Supertest covering Auth, Loans CRUD, Transactional Repayments, Multi-tenant Isolation, and Dashboard Aggregations:

```bash
npm test --prefix server
```

```text
PASS tests/loans.test.ts
PASS tests/auth.test.ts
PASS tests/dashboard.test.ts

Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
Snapshots:   0 total
```

### Run Monorepo Linting

```bash
npm run lint
```

Runs ESLint across both `server` and `apps/mobile` with zero warnings or errors.

### Verify TypeScript Compilation

```bash
# Server typecheck
npm --prefix server run build

# Mobile typecheck
npx --prefix apps/mobile tsc --noEmit
```

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/auth/send-otp`: Sends 6-digit cryptographic OTP (logged to console in dev).
- `POST /api/auth/verify-otp`: Verifies OTP, consumes challenge, upserts user, returns JWT.
- `GET /api/auth/me`: Retrieves current authenticated user profile.

### Dashboard
- `GET /api/dashboard/summary`: Aggregates total lent, total repaid, outstanding balance, overdue balance, active count, overdue count, and repaid count.

### Loans
- `POST /api/loans`: Creates a new loan for authenticated user.
- `GET /api/loans`: Lists user's loans. Supports `?status=all|active|overdue|repaid` and `?search=<name>`.
- `GET /api/loans/:id`: Returns single loan with full repayment history.
- `PATCH /api/loans/:id/repay`: Records a partial or full repayment in a transaction.
- `PATCH /api/loans/:id`: Updates loan metadata (notes, friend name, due date).
- `DELETE /api/loans/:id`: Deletes a loan and associated repayments.

### Receipts
- `POST /api/receipts/upload`: Multipart image upload (JPEG/PNG/WebP, max 5MB). Returns static URL.
- `GET /uploads/:filename`: Serves uploaded receipt image.

---

## 📄 License

ISC License. Built for full-stack engineering evaluation.
