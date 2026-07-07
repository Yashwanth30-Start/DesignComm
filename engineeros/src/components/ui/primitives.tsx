import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Priority, TaskStatus } from "../../types";

/* ------------------------------------------------------------------ panel */

export function GlassPanel({
  children,
  className,
  glow = false,
  onClick
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl2 border border-white/[0.06] bg-glass backdrop-blur-md",
        glow && "shadow-glow",
        onClick && "cursor-pointer transition-colors hover:border-cyan/30 hover:bg-glass-hi",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  className
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-dim">
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------- button */

type ButtonVariant = "primary" | "ghost" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ className, variant = "ghost", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "bg-cyan/15 text-cyan hover:bg-cyan/25 hover:shadow-glow-sm border border-cyan/30",
        variant === "ghost" &&
          "border border-white/10 bg-white/[0.03] text-ink-dim hover:border-white/20 hover:text-ink",
        variant === "danger" &&
          "border border-red/30 bg-red/10 text-red hover:bg-red/20",
        className
      )}
      {...props}
    />
  );
});

/* ------------------------------------------------------------ form fields */

const fieldClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-dim2 focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/30";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldClasses, className)} {...props} />;
  }
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClasses, "min-h-[80px] resize-y", className)}
      {...props}
    />
  );
});

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClasses, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ pills */

export const PRIORITY_STYLES: Record<Priority, string> = {
  critical: "bg-red/15 text-red border-red/30",
  high: "bg-amber/15 text-amber border-amber/30",
  medium: "bg-cyan/15 text-cyan border-cyan/30",
  low: "bg-white/5 text-ink-dim border-white/10"
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        PRIORITY_STYLES[priority]
      )}
    >
      {priority}
    </span>
  );
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done"
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-white/5 text-ink-dim border-white/10",
  in_progress: "bg-cyan/15 text-cyan border-cyan/30",
  blocked: "bg-red/15 text-red border-red/30",
  done: "bg-emerald/15 text-emerald border-emerald/30"
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-purple/30 bg-purple/10 px-2 py-0.5 text-[10px] text-purple">
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- progress */

export function ProgressBar({
  value,
  className,
  color = "cyan"
}: {
  value: number; // 0..100
  className?: string;
  color?: "cyan" | "emerald" | "gold";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          color === "cyan" && "bg-cyan",
          color === "emerald" && "bg-emerald",
          color === "gold" && "bg-gold"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <GlassPanel className="p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-dim">{sub}</p>}
    </GlassPanel>
  );
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-xl2 border border-dashed border-white/10 p-8 text-center">
      <p className="text-sm text-ink-dim">{message}</p>
      {hint && <p className="mt-1 text-xs text-ink-dim2">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ modal */

export function Modal({
  title,
  open,
  onClose,
  children,
  wide = false
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/80 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full rounded-xl2 border border-white/10 bg-bg-2 shadow-glow",
          wide ? "max-w-3xl" : "max-w-xl"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim hover:bg-white/5 hover:text-ink"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
