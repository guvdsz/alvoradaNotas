import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: ReactNode;
  error?: string;
  helperText?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, name, label, icon, error, helperText, ...props },
  ref,
) {
  const inputId = id ?? name;
  const descriptionId = inputId ? `${inputId}-description` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-stone-800"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error || helperText ? descriptionId : undefined}
          className={cn(
            "h-12 w-full rounded-xl border bg-white px-3.5 text-base text-stone-900 outline-none transition placeholder:text-stone-500 focus:border-brand-700 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-500 sm:text-sm",
            icon && "pl-11",
            error
              ? "border-red-600 focus:border-red-700 focus:ring-red-200"
              : "border-stone-500",
            className,
          )}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <p
          id={descriptionId}
          className={cn(
            "text-xs",
            error ? "font-medium text-red-600" : "text-stone-500",
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
});
