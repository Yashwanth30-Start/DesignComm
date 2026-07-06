import type { Asset, IntegrationSource } from "@/types/domain";

// Wing 2 is the V1 deployment boundary. Primary areas are active; D/E 600-700
// are shown but excluded from scope until the platform expands.
export const WING2_AREAS = [
  { id: "A500", active: true },
  { id: "A600", active: true },
  { id: "A700", active: true },
  { id: "B500", active: true },
  { id: "B600", active: true },
  { id: "B700", active: true },
  { id: "C500", active: true },
  { id: "C600", active: true },
  { id: "C700", active: true },
  { id: "D600", active: false },
  { id: "D700", active: false },
  { id: "E600", active: false },
  { id: "E700", active: false },
] as const;

export const INTEGRATION_SOURCES: IntegrationSource[] = [
  { id: "sharepoint-panel-schedules", name: "SharePoint Panel Schedules", currentIngestMode: "local_xlsx", futureService: "Microsoft Graph", isActive: true },
  { id: "procore-rfis", name: "Procore RFI Log", currentIngestMode: "csv_export", futureService: "Procore API", isActive: true },
  { id: "airtable-commissioning", name: "Airtable Commissioning Tracker", currentIngestMode: "csv_export", futureService: "Airtable API", isActive: true },
  { id: "facilitygrid", name: "FacilityGrid", currentIngestMode: "csv_xlsx_export", futureService: "API or Tampermonkey bridge", isActive: true },
  { id: "groupme", name: "GroupMe", currentIngestMode: "json_export", futureService: "GroupMe API", isActive: true },
  { id: "excel-trackers", name: "Excel Trackers", currentIngestMode: "local_xlsx", futureService: "Scheduled ingest", isActive: true },
  { id: "bluebeam", name: "Bluebeam Markups", currentIngestMode: "manual_export", futureService: "Bluebeam Studio API", isActive: false },
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: "fsd-13",
    name: "FSD-13",
    area: "B600",
    room: "Cell WH B-6",
    panel: "KSPA1W2-3B1-2A3",
    circuit: "CKT 08",
    trade: "Shambaugh & Son, LP",
    status: "blocked",
    inspectionStatus: "TY scheduled — awaiting panel verification",
    facilityGridStatus: "Checklist 3/5 complete",
    timeline: [
      { label: "Installed", status: "done", date: "2026-05-02" },
      { label: "Documentation", status: "done", date: "2026-05-14" },
      { label: "TY Inspection", status: "active", date: "2026-07-09" },
      { label: "City Inspection", status: "upcoming" },
      { label: "Energized", status: "upcoming" },
      { label: "Startup", status: "upcoming" },
      { label: "Commissioned", status: "upcoming" },
      { label: "AHJ", status: "upcoming" },
      { label: "Turnover", status: "upcoming" },
    ],
    documents: [
      { id: "d1", name: "KSPA1W2-3B1-2A3-FN4 Panel Schedule.xlsx", kind: "schedule", source: "SharePoint", updatedOn: "2026-06-30" },
      { id: "d2", name: "FSD-13 Submittal.pdf", kind: "submittal", source: "Procore", updatedOn: "2026-04-11" },
      { id: "d3", name: "FSD-13 TY Checklist", kind: "checklist", source: "FacilityGrid", updatedOn: "2026-07-01" },
    ],
    photos: [
      { id: "p1", caption: "Damper install — field verification", takenOn: "2026-05-02" },
      { id: "p2", caption: "Controls wiring in progress", takenOn: "2026-06-18" },
    ],
    constraints: [
      { id: "c1", label: "Controls wiring incomplete on CKT08", status: "open", severity: "high", raisedOn: "2026-06-20", note: "Awaiting Shambaugh crew return to close out low-voltage terminations." },
    ],
    comments: [
      { id: "cm1", author: "J. Alvarez", body: "Panel schedule verified against SharePoint, matches field.", postedOn: "2026-06-29", source: "commissionos" },
      { id: "cm2", author: "Wing 2 Trades", body: "FSD-13 energization pushed to next week pending controls fix.", postedOn: "2026-06-28", source: "groupme" },
    ],
    history: [
      { id: "h1", label: "Constraint raised", detail: "Controls wiring incomplete on CKT08", occurredOn: "2026-06-20" },
      { id: "h2", label: "TY inspection scheduled", detail: "Set for 2026-07-09", occurredOn: "2026-06-25" },
    ],
    relatedAssets: [
      { id: "pnl-b600-04", name: "PNL-B600-04", relationship: "Feeds from panel", status: "ready" },
      { id: "fsd-14", name: "FSD-14", relationship: "Same room, Cell WH B-6", status: "commissioned" },
    ],
  },
  {
    id: "pnl-b600-04",
    name: "PNL-B600-04",
    area: "B600",
    room: "Electrical Room B-6",
    panel: "KSPA1W2-3B1-2A3",
    circuit: "Main",
    trade: "Shambaugh & Son, LP",
    status: "ready",
    inspectionStatus: "TY complete — cleared for city inspection",
    facilityGridStatus: "Checklist 5/5 complete",
    timeline: [
      { label: "Installed", status: "done", date: "2026-04-18" },
      { label: "Documentation", status: "done", date: "2026-04-30" },
      { label: "TY Inspection", status: "done", date: "2026-06-02" },
      { label: "City Inspection", status: "active", date: "2026-07-14" },
      { label: "Energized", status: "upcoming" },
      { label: "Startup", status: "upcoming" },
      { label: "Commissioned", status: "upcoming" },
      { label: "AHJ", status: "upcoming" },
      { label: "Turnover", status: "upcoming" },
    ],
    documents: [
      { id: "d1", name: "KSPA1W2-3B1-2A3 Panel Schedule.xlsx", kind: "schedule", source: "SharePoint", updatedOn: "2026-06-30" },
    ],
    photos: [{ id: "p1", caption: "Panel labeled and torqued", takenOn: "2026-05-20" }],
    constraints: [],
    comments: [
      { id: "cm1", author: "M. Reyes", body: "City inspection confirmed for 07/14, ready.", postedOn: "2026-07-02", source: "commissionos" },
    ],
    history: [
      { id: "h1", label: "TY inspection passed", detail: "No punch items", occurredOn: "2026-06-02" },
    ],
    relatedAssets: [
      { id: "fsd-13", name: "FSD-13", relationship: "Downstream circuit", status: "blocked" },
    ],
  },
];

export function getAssetById(id: string): Asset | undefined {
  return MOCK_ASSETS.find((asset) => asset.id === id);
}
