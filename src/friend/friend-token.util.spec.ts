import {
  expiryFrom,
  generateToken,
  hashToken,
  isExpired,
  normalizeEmail,
} from './friend-token.util';

describe('friend-token util', () => {
  it('generates a url-safe token whose hash matches hashToken', () => {
    const { token, tokenHash } = generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toBe(hashToken(token));
    expect(tokenHash).not.toContain(token);
  });

  it('generates unique tokens', () => {
    expect(generateToken().token).not.toBe(generateToken().token);
  });

  it('computes expiry and detects expired timestamps', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    const expiresAt = expiryFrom(now, 7);
    expect(expiresAt.toISOString()).toBe('2026-10-08T00:00:00.000Z');
    expect(isExpired(expiresAt, now)).toBe(false);
    expect(isExpired(expiresAt, new Date('2026-10-08T00:00:00Z'))).toBe(true);
  });

  it('normalizes emails', () => {
    expect(normalizeEmail('  Bob@Example.COM ')).toBe('bob@example.com');
  });
});
