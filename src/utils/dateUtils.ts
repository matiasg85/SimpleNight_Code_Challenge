/**
 * dateUtils.ts
 * Lightweight helpers for formatting and decomposing ISO date strings.
 * All functions treat the input as local time (appending T00:00:00) to
 * avoid UTC-offset surprises when extracting day/month values.
 */

/**
 * Returns the full month name and 4-digit year for an ISO date string.
 * @example getMonthAndYear('2026-08-01') → { month: 'August', year: 2026 }
 */
export function getMonthAndYear(isoDate: string): { month: string; year: number } {
  const date = new Date(`${isoDate}T00:00:00`);
  return {
    month: date.toLocaleString('en-US', { month: 'long' }),
    year: date.getFullYear(),
  };
}

/**
 * Returns the day of the month (1–31) for an ISO date string.
 * @example getDayOfMonth('2026-08-01') → 1
 */
export function getDayOfMonth(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00`).getDate();
}
