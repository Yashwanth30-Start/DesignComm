import type { NormalizedRecord } from "@/types/domain";

// The cross-app source registry. Source names must exactly match the pipeline
// output source strings — this is the single copy shared by search and the
// circuit drawer.
export const SOURCES: { id: string; label: string; source: string }[] = [
  { id: "airtable", label: "Airtable", source: "Airtable Commissioning Tracker" },
  { id: "groupme", label: "GroupMe", source: "GroupMe" },
  { id: "rfis", label: "RFIs", source: "Procore RFI Log" },
  { id: "constraints", label: "Constraints", source: "Cx Constraint Log" },
  { id: "mel", label: "MEL", source: "MEL Master Equipment List" },
  { id: "fa", label: "FA Testing", source: "W2 FA Testing Tracker" },
];

export const PANEL_SOURCE = "SharePoint Panel Schedules";

export function sourceLabel(source: string): string {
  return SOURCES.find((s) => s.source === source)?.label ?? source;
}

export function recordHaystack(record: NormalizedRecord): string {
  return (
    record.searchText ??
    `${record.primaryLabel} ${record.secondaryLabel ?? ""} ${record.status ?? ""} ${record.area ?? ""} ${record.location ?? ""} ${record.trade ?? ""}`.toLowerCase()
  );
}
