import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDeltaPct,
  formatMoney,
  formatMoneyCompact,
  formatMonthLong,
  formatMonthShort,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from './labels';

/** ru-RU packs digits with non-breaking / narrow spaces; normalise them for stable assertions. */
const norm = (value: string): string => value.replace(/[\u00a0\u202f]/g, ' ');

describe('formatMoney', () => {
  it('divides integer kopecks back to rubles and drops the fractional part', () => {
    expect(norm(formatMoney(150_000))).toBe('1 500 ₽');
  });

  it('formats zero', () => {
    expect(norm(formatMoney(0))).toBe('0 ₽');
  });

  it('never shows kopecks even when they are present', () => {
    // 1 500,99 ₽ worth of kopecks rounds to whole rubles, no decimal separator.
    expect(norm(formatMoney(150_099))).not.toContain(',');
  });

  it('groups thousands', () => {
    expect(norm(formatMoney(123_456_700))).toBe('1 234 567 ₽');
  });
});

describe('formatMoneyCompact', () => {
  it('renders millions compactly', () => {
    // 4 500 000 ₽ -> "4,5 млн ₽"
    const out = norm(formatMoneyCompact(450_000_000));
    expect(out).toContain('4,5');
    expect(out).toContain('млн');
    expect(out).toContain('₽');
  });
});

describe('formatNumber', () => {
  it('adds a thousands separator', () => {
    expect(norm(formatNumber(1284))).toBe('1 284');
  });
});

describe('formatPercent', () => {
  it('appends a percent sign with up to one decimal', () => {
    expect(norm(formatPercent(42.5))).toBe('42,5 %');
    expect(norm(formatPercent(50))).toBe('50 %');
  });
});

describe('formatDeltaPct', () => {
  it('shows an explicit plus for a positive delta', () => {
    expect(formatDeltaPct(12.4).startsWith('+')).toBe(true);
    expect(norm(formatDeltaPct(12.4))).toContain('12,4');
  });

  it('shows a minus for a negative delta and no sign for zero', () => {
    const negative = formatDeltaPct(-3);
    expect(negative).not.toContain('+');
    expect(negative).toContain('3');
    expect(formatDeltaPct(0).startsWith('+')).toBe(false);
  });
});

describe('formatDate / formatDateTime', () => {
  it('formats a date with a short month and the year', () => {
    const out = norm(formatDate('2026-01-15T10:00:00.000Z'));
    expect(out).toContain('2026');
    expect(out).toContain('янв');
  });

  it('adds hours and minutes for date-time', () => {
    expect(norm(formatDateTime('2026-01-15T10:00:00.000Z'))).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatMonthShort / formatMonthLong', () => {
  it('turns a YYYY-MM bucket into a short month tick', () => {
    expect(norm(formatMonthShort('2026-01'))).toContain('янв');
  });

  it('spells out the month and year for a tooltip heading', () => {
    const out = norm(formatMonthLong('2026-01'));
    expect(out).toContain('январь');
    expect(out).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports minutes ago inside the hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-17T12:00:00.000Z'));
    expect(norm(formatRelativeTime('2026-07-17T11:55:00.000Z'))).toContain('5');
  });

  it('falls back to a full date after a week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-17T12:00:00.000Z'));
    // 10 days earlier is past the one-week window, so it renders as an absolute date.
    expect(norm(formatRelativeTime('2026-07-07T12:00:00.000Z'))).toContain('2026');
  });
});
