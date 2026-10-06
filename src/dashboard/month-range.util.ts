export interface MonthRange {
  /** Calendar month in `YYYY-MM` form. */
  month: string;
  timeZone: string;
  /** Inclusive start instant of the month in `timeZone`. */
  start: Date;
  /** Exclusive end instant (start of the following month). */
  end: Date;
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function zonedParts(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instant));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function offsetMs(instant: number, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Instant at which `year`-`monthIndex` (0-based) begins in `timeZone`. */
function zonedMonthStart(
  year: number,
  monthIndex: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, monthIndex, 1);
  // Second pass corrects for the offset changing (DST) between the guess and
  // the real start instant.
  const first = guess - offsetMs(guess, timeZone);
  return new Date(guess - offsetMs(first, timeZone));
}

/**
 * Resolves the month window used for dashboard totals. Defaults to the
 * current month in the user's time zone; an invalid zone falls back to UTC.
 */
export function getMonthRange(
  timeZone: string,
  month?: string,
  now: Date = new Date(),
): MonthRange {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';

  let year: number;
  let monthIndex: number;
  if (month) {
    const [y, m] = month.split('-').map(Number);
    year = y;
    monthIndex = m - 1;
  } else {
    const p = zonedParts(now.getTime(), zone);
    year = p.year;
    monthIndex = p.month - 1;
  }

  const start = zonedMonthStart(year, monthIndex, zone);
  const end = zonedMonthStart(year, monthIndex + 1, zone);
  const label = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  return { month: label, timeZone: zone, start, end };
}
