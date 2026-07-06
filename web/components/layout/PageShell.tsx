import type { ReactNode } from "react";
import { NavRail } from "./NavRail";
import { Topbar } from "./Topbar";

export function PageShell({ children, breadcrumb }: { children: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="min-h-screen text-ink">
      <NavRail />
      <Topbar breadcrumb={breadcrumb} />
      <main className="md:pl-16">{children}</main>
    </div>
  );
}
