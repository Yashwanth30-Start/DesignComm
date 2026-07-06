// Core domain types for CommissionOS V1.
// Mirrors the shapes defined in ../docs/integration-contract.md and
// ../../backend/schema.sql so the design system stays honest to the real
// data model even though V1 renders mock data only.

export type WorkflowStatus =
  | "ready"
  | "waiting"
  | "blocked"
  | "commissioned"
  | "complete";

export type TimelineStageStatus = "done" | "active" | "upcoming" | "blocked";

export interface TimelineStage {
  label: string;
  status: TimelineStageStatus;
  date?: string;
  note?: string;
}

export type CircuitStatus = "energized" | "de-energized" | "blocked" | "spare";

export interface PanelCircuitRow {
  circuit: string;
  description: string;
  load: string;
  status: CircuitStatus;
}

export interface PanelScheduleData {
  panelId: string;
  panelName: string;
  circuits: PanelCircuitRow[];
}

export type IntegrationSourceId =
  | "sharepoint-panel-schedules"
  | "procore-rfis"
  | "airtable-commissioning"
  | "facilitygrid"
  | "groupme"
  | "excel-trackers"
  | "bluebeam";

export interface IntegrationSource {
  id: IntegrationSourceId;
  name: string;
  currentIngestMode: string;
  futureService: string;
  isActive: boolean;
}

export type RecordType =
  | "panel_schedule"
  | "panel_circuit"
  | "rfi"
  | "commissioning_schedule"
  | "inspection_readiness"
  | "asset"
  | "constraint"
  | "checklist"
  | "document"
  | "field_message"
  | "tracker_row";

export interface NormalizedRecord {
  source: string;
  sourceRecordId: string;
  sourcePath: string;
  sourceSheet?: string;
  recordType: RecordType | string;
  primaryLabel: string;
  secondaryLabel?: string;
  status?: string;
  area?: string;
  location?: string;
  trade?: string;
  assetKeys: string[];
  panelKeys: string[];
  circuitKeys: string[];
  rfiKeys: string[];
  /** Pre-lowercased haystack emitted by the pipeline; used for client search. */
  searchText?: string;
  /** Original source fields, shape varies per source. */
  raw?: Record<string, unknown> | null;
}

export interface Constraint {
  id: string;
  label: string;
  status: "open" | "resolved";
  severity: "low" | "medium" | "high";
  raisedOn: string;
  resolvedOn?: string;
  note: string;
}

export interface DocumentRef {
  id: string;
  name: string;
  kind: "drawing" | "schedule" | "submittal" | "checklist" | "photo-log";
  source: string;
  updatedOn: string;
}

export interface PhotoRef {
  id: string;
  caption: string;
  takenOn: string;
}

export interface CommentEntry {
  id: string;
  author: string;
  body: string;
  postedOn: string;
  source: "groupme" | "commissionos" | "procore";
}

export interface HistoryEntry {
  id: string;
  label: string;
  detail: string;
  occurredOn: string;
}

export interface RelatedAsset {
  id: string;
  name: string;
  relationship: string;
  status: WorkflowStatus;
}

export interface Asset {
  id: string;
  name: string;
  area: string;
  room: string;
  panel: string;
  circuit: string;
  trade: string;
  status: WorkflowStatus;
  inspectionStatus: string;
  facilityGridStatus: string;
  timeline: TimelineStage[];
  documents: DocumentRef[];
  photos: PhotoRef[];
  constraints: Constraint[];
  comments: CommentEntry[];
  history: HistoryEntry[];
  relatedAssets: RelatedAsset[];
}
