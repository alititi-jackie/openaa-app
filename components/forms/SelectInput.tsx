import type { SelectHTMLAttributes } from "react";

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition",
        "focus:border-slate-900 focus:ring-2 focus:ring-slate-100",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
