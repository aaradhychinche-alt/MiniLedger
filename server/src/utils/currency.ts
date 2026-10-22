import { Prisma } from '@prisma/client';

/**
 * Converts a string/number/Decimal to a 2-decimal rounded number for clean JSON serialization
 */
export function toNumber(val: Prisma.Decimal | number | string | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Math.round(val * 100) / 100;
  if (typeof val === 'string') return Math.round(parseFloat(val) * 100) / 100;
  return Math.round(val.toNumber() * 100) / 100;
}

/**
 * Formats a number in Indian Rupees format (e.g. ₹12,500)
 */
export function formatINR(val: Prisma.Decimal | number | string): string {
  const num = toNumber(val);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}
