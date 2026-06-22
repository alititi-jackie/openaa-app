import type { ReactNode } from "react";

const toneClasses = {
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-100 bg-blue-50 text-blue-800",
  danger: "border-red-200 bg-red-50 text-red-700",
} as const;

export function AdminAlert({ children, tone = "warning" }: { children: ReactNode; tone?: keyof typeof toneClasses }) {
  return <div className={`rounded-xl border p-4 text-sm font-bold leading-6 ${toneClasses[tone]}`}>{children}</div>;
}
