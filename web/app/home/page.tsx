import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import { CommandCenter } from "@/features/home/CommandCenter";

export const metadata: Metadata = { title: "Today — CommissionOS" };

export default function HomePage() {
  return (
    <PageShell breadcrumb={<span>Today</span>}>
      <CommandCenter />
    </PageShell>
  );
}
