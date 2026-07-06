import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-tight transition-all duration-400 ease-cinematic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 disabled:opacity-40 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-cyan to-purple text-void shadow-glow-cyan hover:brightness-110 active:scale-[0.98]",
        secondary:
          "bg-glass border border-glass-border-hi text-ink backdrop-blur-xs hover:bg-glass-hi hover:border-cyan/40",
        ghost: "text-ink-dim hover:text-ink hover:bg-glass",
        destructive: "bg-red/15 border border-red/40 text-red hover:bg-red/25",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
