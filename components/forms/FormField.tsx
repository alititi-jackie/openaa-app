import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="text-red-600">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-gray-400">{hint}</span> : null}
      {error ? <span className="block text-xs leading-5 text-red-600">{error}</span> : null}
    </label>
  );
}
