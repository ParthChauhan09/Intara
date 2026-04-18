import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-full border bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 transition-colors",
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
Input.displayName = "Input";

export { Input };
