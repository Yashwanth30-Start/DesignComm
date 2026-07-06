import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

// Infinite horizontal marquee strip (Editions-style ticker). Content is
// duplicated once so the CSS keyframe loop is seamless.
export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex w-full overflow-hidden", className)}>
      <div className="animate-marquee flex shrink-0 items-center gap-12 pr-12">{children}</div>
      <div aria-hidden className="animate-marquee flex shrink-0 items-center gap-12 pr-12">
        {children}
      </div>
    </div>
  );
}
