import { cn } from "@/utils/cn";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Divider({ orientation = "horizontal", className }: DividerProps) {
  return (
    <div
      className={cn(
        orientation === "horizontal"
          ? "h-px w-full bg-gradient-to-r from-transparent via-glass-border-hi to-transparent"
          : "w-px h-full bg-gradient-to-b from-transparent via-glass-border-hi to-transparent",
        className
      )}
    />
  );
}
