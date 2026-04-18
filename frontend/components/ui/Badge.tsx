import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "status-open"
  | "status-pending"
  | "status-reviewed"
  | "status-escalated"
  | "status-closed"
  | "priority-urgent"
  | "priority-high"
  | "priority-medium"
  | "priority-low"
  | "success"
  | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-200 text-slate-700",
  secondary: "bg-slate-100 text-slate-700",
  outline: "border border-slate-200 bg-transparent text-slate-700",
  "status-open": "bg-blue-100 text-blue-700",
  "status-pending": "bg-amber-100 text-amber-700",
  "status-reviewed": "bg-purple-100 text-purple-700",
  "status-escalated": "bg-rose-100 text-rose-700",
  "status-closed": "bg-emerald-100 text-emerald-700",
  "priority-urgent": "bg-rose-100 text-rose-700",
  "priority-high": "bg-rose-100 text-rose-700",
  "priority-medium": "bg-amber-100 text-amber-700",
  "priority-low": "bg-emerald-100 text-emerald-700",
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-rose-100 text-rose-700",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, variantStyles };
export type { BadgeProps };
