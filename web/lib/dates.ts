import type { NormalizedRecord } from "@/types/domain";

// Shared date extraction for imported records. Pipeline sources put dates in
// wildly different raw fields; these helpers find the best timestamp per record.
export const DATE_KEYS = [
  "occurredOn",
  "Last Modified",
  "Date of Test",
  "Created",
  "Initiated At",
  "dateIdentified",
  "completedDate",
  "testDate",
  "updatedOn",
  "Due Date",
  "Closed Date",
];

export function parseDateValue(value: string): number {
  if (!value) return 0;
  let t = Date.parse(value);
  if (!Number.isNaN(t)) return t;
  t = Date.parse(value.replace(" ", "T"));
  if (!Number.isNaN(t)) return t;
  const m = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const yearRaw = m[3] ?? "";
    const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
    return new Date(year, Number(m[1]) - 1, Number(m[2])).getTime();
  }
  return 0;
}

export function recordDate(record: NormalizedRecord): number {
  const candidates: string[] = [];
  if (record.status) candidates.push(record.status);
  const raw = record.raw ?? {};
  for (const key of DATE_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string") candidates.push(value);
  }
  let best = 0;
  for (const candidate of candidates) {
    const t = parseDateValue(candidate);
    if (t > best) best = t;
  }
  return best;
}

export function formatDate(t: number): string {
  if (t <= 0) return "";
  return new Date(t).toISOString().slice(0, 10);
}
