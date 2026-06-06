import type { ReactNode } from "react";

type FormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function FormShell({ title, description, children }: FormShellProps) {
  return (
    <div className="mx-auto max-w-2xl px-0 py-2 pb-24 sm:px-4 sm:py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
      </section>
      {children}
    </div>
  );
}
