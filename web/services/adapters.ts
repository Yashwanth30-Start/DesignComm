import type { IntegrationSourceId, NormalizedRecord } from "@/types/domain";

// V1 placeholder adapter layer. Each adapter will eventually call its real
// service (see futureService in ../lib/mock-data.ts INTEGRATION_SOURCES /
// ../../backend/source-adapters.json) and return NormalizedRecord[]. None of
// them make network calls yet — CommissionOS V1 renders typed mock data only.
export interface SourceAdapter {
  id: IntegrationSourceId;
  fetchRecords(): Promise<NormalizedRecord[]>;
}

function stubAdapter(id: IntegrationSourceId): SourceAdapter {
  return {
    id,
    async fetchRecords() {
      return [];
    },
  };
}

export const ADAPTERS: Record<IntegrationSourceId, SourceAdapter> = {
  "sharepoint-panel-schedules": stubAdapter("sharepoint-panel-schedules"),
  "procore-rfis": stubAdapter("procore-rfis"),
  "airtable-commissioning": stubAdapter("airtable-commissioning"),
  facilitygrid: stubAdapter("facilitygrid"),
  groupme: stubAdapter("groupme"),
  "excel-trackers": stubAdapter("excel-trackers"),
  bluebeam: stubAdapter("bluebeam"),
};
