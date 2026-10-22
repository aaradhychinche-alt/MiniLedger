export const Colors = {
  // Backgrounds
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9', // Slate 100

  // Text
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  // Brand Emerald
  primary: '#059669', // Emerald 600
  primaryHover: '#047857', // Emerald 700
  primaryLight: '#ECFDF5', // Emerald 50
  primaryBorder: '#A7F3D0', // Emerald 200

  // Overdue / Danger
  danger: '#DC2626', // Red 600
  dangerLight: '#FEF2F2', // Red 50
  dangerBorder: '#FECACA', // Red 200

  // Warning / Partially Repaid
  warning: '#D97706', // Amber 600
  warningLight: '#FFFBEB', // Amber 50
  warningBorder: '#FDE68A', // Amber 200

  // Neutral borders
  border: '#E2E8F0', // Slate 200
  borderDark: '#CBD5E1', // Slate 300
  divider: '#F1F5F9',

  // Status badges
  statusPending: {
    bg: '#F1F5F9',
    text: '#475569',
    border: '#E2E8F0',
  },
  statusPartial: {
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
  },
  statusRepaid: {
    bg: '#ECFDF5',
    text: '#047857',
    border: '#A7F3D0',
  },
  statusOverdue: {
    bg: '#FEF2F2',
    text: '#B91C1C',
    border: '#FECACA',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

/**
 * Consistent Indian Rupee formatting (e.g. ₹12,500)
 */
export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date nicely (e.g. "25 Oct 2026")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
