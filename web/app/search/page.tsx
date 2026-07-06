import { Suspense } from "react";
import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import { SearchResults } from "@/features/search/SearchResults";

export const metadata: Metadata = { title: "Search — CommissionOS" };

export default function SearchPage() {
  return (
    <PageShell breadcrumb={<span>Search</span>}>
      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </PageShell>
  );
}
