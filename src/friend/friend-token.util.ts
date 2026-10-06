import { createHash, randomBytes } from 'crypto';

export const RESEND_COOLDOWN_MS = 60 * 60 * 1000;
export const MAX_SENDS = 3;
export const REJECT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The raw token goes in the email; only its hash is persisted. */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export function expiryFrom(now: Date, ttlDays: number): Date {
  return new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
