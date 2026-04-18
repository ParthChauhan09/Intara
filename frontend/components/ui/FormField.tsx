import { cn } from "@/lib/utils";
import { LabelHTMLAttributes, ReactNode, forwardRef } from "react";

interface FormFieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}

const FormField = forwardRef<HTMLLabelElement, FormFieldProps>(
  ({ className, label, children, error, required, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          ref={ref}
          className={cn("block text-sm font-medium leading-none text-slate-700", className)}
          {...props}
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        {children}
        {error && (
          <p className="text-xs text-rose-600">{error}</p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };
