/**
 * School calendar dates (DOB / admission) — always Asia/Kolkata day.
 * Avoids IST vs UTC “±1 day” when Mongo stores Date and JSON sends ISO.
 */

const SCHOOL_TZ = "Asia/Kolkata";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD for the school timezone (India). */
export function toCalendarDateString(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
    }
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return "";
  return `${y}-${m}-${d}`;
}

/** Human display e.g. 15 Jan 2020 — same day as toCalendarDateString. */
export function formatCalendarDate(value: unknown): string {
  const ymd = toCalendarDateString(value);
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  // Format from UTC noon of that calendar day so timezone can’t shift the label
  const stable = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(stable);
}

/** Parse typed/selected calendar day → Date at UTC noon (stable in Mongo). */
export function parseCalendarDate(value: unknown): Date | null {
  const ymd = toCalendarDateString(value);
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return isNaN(date.getTime()) ? null : date;
}

/** Today in school timezone as YYYY-MM-DD. */
export function todayCalendarDateString(): string {
  return toCalendarDateString(new Date());
}
