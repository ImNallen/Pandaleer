export type LocalDate = string & { readonly __brand: 'LocalDate' };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseLocalDate(value: string): LocalDate {
  if (!ISO_DATE.test(value) || format(toUtc(value)) !== value) {
    throw new Error(`Not a calendar date: ${value}`);
  }
  return value as LocalDate;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const utc = toUtc(date);
  utc.setUTCDate(utc.getUTCDate() + days);
  return format(utc);
}

function toUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(utc: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}` as LocalDate;
}

/** Days since 1970-01-01; a stable number for seeding and week arithmetic. */
export function epochDay(date: LocalDate): number {
  return Math.round(toUtc(date).getTime() / 86_400_000);
}

/** The Monday on or before `date`. */
export function weekStart(date: LocalDate): LocalDate {
  const mondayBased = (toUtc(date).getUTCDay() + 6) % 7;
  return addDays(date, -mondayBased);
}
