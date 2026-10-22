/**
 * Normalizes and validates Indian phone numbers into E.164 format (+91XXXXXXXXXX)
 */
export function normalizeIndianPhoneNumber(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  // Remove whitespace, dashes, dots, parentheses
  const cleaned = input.replace(/[\s\-\(\)\.]/g, '');

  let digits = '';

  if (cleaned.startsWith('+91')) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    digits = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    digits = cleaned.slice(1);
  } else {
    digits = cleaned;
  }

  // Indian mobile numbers must be 10 digits and start with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  return null;
}

/**
 * Safely masks a phone number for logging or public display: +91 ******3210
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return '******';
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-4);
  return `${prefix} ******${suffix}`;
}
