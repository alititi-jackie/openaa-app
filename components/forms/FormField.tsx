"use client";

import { Children, cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  fieldKey?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, fieldKey, required, error, hint, children }: FormFieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? `post-field-${generatedId}`;
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;

  // Each field has one control as its first child. Forward the same
  // attributes through TextInput, SelectInput, TextArea and LocationSelect.
  const controls = Children.map(children, (child, index) => {
    if (index !== 0 || !isValidElement<InputHTMLAttributes<HTMLInputElement>>(child)) return child;
    return cloneElement(child, {
      id: controlId,
      name: fieldKey ?? child.props.name,
      required: required || child.props.required,
      "aria-invalid": error ? true : child.props["aria-invalid"],
      "aria-describedby": [child.props["aria-describedby"], hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(" ") || undefined,
    });
  });

  return (
    <div className="block space-y-1.5 outline-none" data-field={fieldKey} data-field-error={fieldKey && error ? "true" : undefined} tabIndex={fieldKey ? -1 : undefined}>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700" htmlFor={controlId}>
        {label}
        {required ? <span className="text-red-600">*</span> : null}
      </label>
      {controls}
      {hint ? <span id={hintId} className="block text-xs leading-5 text-gray-400">{hint}</span> : null}
      {error ? <span id={errorId} className="block text-xs leading-5 text-red-600">{error}</span> : null}
    </div>
  );
}
