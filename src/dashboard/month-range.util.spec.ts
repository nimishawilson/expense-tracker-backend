import { getMonthRange } from './month-range.util';

describe('getMonthRange', () => {
  it('uses UTC month boundaries for the UTC zone', () => {
    const r = getMonthRange('UTC', undefined, new Date('2026-09-15T10:00:00Z'));
    expect(r.month).toBe('2026-09');
    expect(r.start.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('shifts boundaries for zones ahead of UTC', () => {
    // 2026-08-31T20:00Z is already September in Asia/Kolkata (UTC+5:30).
    const r = getMonthRange(
      'Asia/Kolkata',
      undefined,
      new Date('2026-08-31T20:00:00Z'),
    );
    expect(r.month).toBe('2026-09');
    expect(r.start.toISOString()).toBe('2026-08-31T18:30:00.000Z');
    expect(r.end.toISOString()).toBe('2026-09-30T18:30:00.000Z');
  });

  it('respects DST when computing boundaries', () => {
    const r = getMonthRange('America/New_York', '2026-03');
    expect(r.start.toISOString()).toBe('2026-03-01T05:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-04-01T04:00:00.000Z');
  });

  it('rolls over the year for December', () => {
    const r = getMonthRange('UTC', '2026-12');
    expect(r.end.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('falls back to UTC for an invalid time zone', () => {
    const r = getMonthRange('Not/AZone', '2026-09');
    expect(r.timeZone).toBe('UTC');
    expect(r.start.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });
});
