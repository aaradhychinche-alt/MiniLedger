import { env } from '../config/env';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
  },
  otp: (maskedPhone: string, otp: string) => {
    if (env.NODE_ENV !== 'production') {
      console.log('\n=========================================');
      console.log(`🔑 DEV OTP for ${maskedPhone}: >>> ${otp} <<<`);
      console.log(`(Valid for ${env.OTP_EXPIRY_MINUTES} minutes)`);
      console.log('=========================================\n');
    }
  },
};
