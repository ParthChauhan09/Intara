import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 5, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-3xl border bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 transition-colors",
          "focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-900/10",
          !error && "border-slate-200",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
