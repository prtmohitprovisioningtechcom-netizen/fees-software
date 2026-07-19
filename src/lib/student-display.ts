/** Shared helpers so student details look the same on list / view / fee / receipt. */

export {
  toCalendarDateString as toLocalDateInput,
  formatCalendarDate,
} from "./calendar-date";

const PLACEHOLDER_RE =
  /^(?:-|–|—|N\/A|n\/a|NA|null|undefined|0000000000|000000|Registered from SDMS form)$/i;

/** Hide create-time junk placeholders; show a consistent empty mark. */
export function displayStudentField(value: unknown, empty = "—"): string {
  const text = String(value ?? "").trim();
  if (!text || PLACEHOLDER_RE.test(text)) return empty;
  return text;
}

export function refId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "_id" in value) {
    return String((value as { _id: string })._id);
  }
  return "";
}

export function refName(value: unknown, empty = "—"): string {
  if (!value) return empty;
  if (typeof value === "string") return displayStudentField(value, empty);
  if (typeof value === "object" && value && "name" in value) {
    return displayStudentField((value as { name?: string }).name, empty);
  }
  return empty;
}

/** Multer can turn duplicate FormData keys into arrays — always take last scalar. */
export function asScalar(value: unknown): string {
  if (Array.isArray(value)) return String(value[value.length - 1] ?? "").trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
