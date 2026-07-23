import type { NormalizedRecord, PanelScheduleData } from "@/types/domain";

// Pure helpers for the PJKS-style energized-circuits board: parse panel IDs
// into their metadata segments, normalize live/mock circuits into one shape,
// and fold circuits into the two-bank breaker layout with multi-pole merging.

export type BoardStatus =
  | "energized"
  | "de-energized"
  | "blocked"
  | "spare"
  | "future"
  | "blank"
  | "unknown";

export interface BoardCircuit {
  circuit: number;
  /** Load / downstream description; "BLANK" for an empty position. */
  title: string;
  /** Breaker size, e.g. "20A". */
  breaker?: string;
  status: BoardStatus;
}

/** One rendered cell — a multi-pole feed merges consecutive same-bank circuits. */
export interface BoardCell {
  poles: number[];
  title: string;
  breaker?: string;
  status: BoardStatus;
}

export const BOARD_STATUS_LABELS: Record<BoardStatus, string> = {
  energized: "Energized",
  "de-energized": "De-energized",
  blocked: "Blocked",
  spare: "Spare",
  future: "Future",
  blank: "BLANK",
  unknown: "Unverified",
};

// Panel-type codes as they appear in the panel ID. Only codes confirmed from
// real schedules belong here — unknown codes render as the raw code.
const PANEL_TYPE_LABELS: Record<string, string> = {
  GE2: "Emergency General Panel 120/208V",
};

export interface PanelMeta {
  project?: string;
  substation?: string;
  location?: string;
  typeCode?: string;
  typeLabel?: string;
  specifier?: string;
  /** Panel ID without the project prefix — how the field refers to it. */
  shortName: string;
}

// Panel IDs are dash-segmented: KSPA1W2-8J1-1A3-GE2-2A =
// project - substation - location - panel type - specifier.
// Legacy/mock 3-segment IDs carry only project/substation/location.
export function parsePanelMeta(panelId: string): PanelMeta {
  const segments = panelId.split("-").filter(Boolean);
  if (segments.length >= 5) {
    const typeCode = segments[3] ?? "";
    return {
      project: segments[0],
      substation: segments[1],
      location: segments[2],
      typeCode,
      typeLabel: PANEL_TYPE_LABELS[typeCode.toUpperCase()],
      specifier: segments.slice(4).join("-"),
      shortName: segments.slice(1).join("-"),
    };
  }
  if (segments.length >= 3) {
    return {
      project: segments[0],
      substation: segments[1],
      location: segments[2],
      shortName: segments.slice(1).join("-"),
    };
  }
  return { shortName: panelId };
}

export function statusFromText(text: string | undefined): BoardStatus | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/de-?energiz/.test(t)) return "de-energized";
  if (/energiz/.test(t)) return "energized";
  if (/future/.test(t)) return "future";
  if (/spare/.test(t)) return "spare";
  if (/block/.test(t)) return "blocked";
  if (/blank/.test(t)) return "blank";
  return null;
}

// Live path: imported SharePoint panel_circuit records → board circuits.
// Status comes only from what the record actually says; rows without any
// status text stay "unknown" rather than being guessed.
export function boardFromRecords(records: NormalizedRecord[]): BoardCircuit[] {
  const map = new Map<number, BoardCircuit>();
  for (const record of records) {
    const raw = (record.raw ?? {}) as Record<string, unknown>;
    const num = Number(raw.circuit ?? record.circuitKeys.find((k) => k.length > 0));
    if (!Number.isFinite(num) || num <= 0 || map.has(num)) continue;
    const downstream = typeof raw.downstream === "string" ? raw.downstream.trim() : "";
    const breaker =
      typeof raw.breaker === "string" && raw.breaker.trim() !== "" ? raw.breaker.trim() : undefined;
    const isBlank = downstream === "" || downstream.toUpperCase() === "BLANK";
    const status: BoardStatus = isBlank
      ? "blank"
      : statusFromText(typeof raw.status === "string" ? raw.status : undefined) ??
        statusFromText(record.status) ??
        "unknown";
    map.set(num, { circuit: num, title: isBlank ? "BLANK" : downstream, breaker, status });
  }
  return [...map.values()].sort((a, b) => a.circuit - b.circuit);
}

export function boardFromMock(schedule: PanelScheduleData): BoardCircuit[] {
  return schedule.circuits
    .map((row) => ({
      circuit: Number(row.circuit),
      title: row.description,
      breaker: row.load && row.load !== "—" ? row.load : undefined,
      status: (row.description.toUpperCase() === "BLANK" ? "blank" : row.status) as BoardStatus,
    }))
    .filter((c) => Number.isFinite(c.circuit) && c.circuit > 0)
    .sort((a, b) => a.circuit - b.circuit);
}

// One bank of the two-bank layout (parity 1 = odd/left, 0 = even/right).
// Consecutive same-bank circuits feeding the same load (a 2/3-pole breaker)
// merge into a single cell, like the tall green sub-feed cell on the real page.
export function bankCells(circuits: BoardCircuit[], parity: 0 | 1): BoardCell[] {
  const bank = circuits
    .filter((c) => c.circuit % 2 === parity)
    .sort((a, b) => a.circuit - b.circuit);
  const cells: BoardCell[] = [];
  for (const c of bank) {
    const prev = cells[cells.length - 1];
    const mergeable =
      prev !== undefined &&
      c.status !== "blank" &&
      prev.title === c.title &&
      prev.status === c.status &&
      prev.poles[prev.poles.length - 1] === c.circuit - 2;
    if (mergeable) prev.poles.push(c.circuit);
    else cells.push({ poles: [c.circuit], title: c.title, breaker: c.breaker, status: c.status });
  }
  return cells;
}

/**
 * Search tokens for a load title, most specific first. Tag-shaped tokens are
 * pulled from anywhere in the title ("FSD-13 controls" → FSD-13), the project
 * prefix is stripped (KSPA1W2-FSD-02 → FSD-02), and shared-load titles expand
 * to each tag (KSPA1W2-FSD-36/37 → FSD-36, FSD-37).
 */
export function assetTokens(title: string): string[] {
  const tokens: string[] = [];
  const push = (t: string) => {
    const v = t.trim();
    if (v.length >= 3 && !tokens.some((x) => x.toLowerCase() === v.toLowerCase())) tokens.push(v);
  };
  const expand = (t: string) => {
    const slash = t.match(/^(.*-)(\d+)\/(\d+)$/);
    if (slash) {
      push(`${slash[1] ?? ""}${slash[2] ?? ""}`);
      push(`${slash[1] ?? ""}${slash[3] ?? ""}`);
    } else {
      push(t);
    }
  };
  // Tag-shaped tokens anywhere in the title (FSD-13, FA-118/119, OHD-04).
  for (const m of title.matchAll(/\b[A-Z]{2,5}-\d+[A-Z0-9]*(?:\/\d+)?\b/gi)) expand(m[0]);
  // The title minus the project prefix (KSPA1W2-FSD-02 → FSD-02).
  expand(title.match(/^[A-Z0-9]{5,}-(.+)$/i)?.[1] ?? title);
  return tokens;
}
