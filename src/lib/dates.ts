const DAY = 24 * 60 * 60 * 1000;

/** Parses "2026-09-20" into midnight UTC, which is how plan days are stored. */
export function dayFromInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

/** The inverse, for prefilling a date input. */
export function dayToInput(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

/** Today at midnight UTC, judged in the given timezone. */
export function todayIn(timezone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return dayFromInput(parts) ?? new Date();
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY);
}

export function formatDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatTime(startTime: string | null | undefined): string {
  if (!startTime) return "all day";
  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h)) return "all day";
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")}${suffix}`;
}

/** How a countdown should read. Negative numbers are in the past. */
export function countdownLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}
