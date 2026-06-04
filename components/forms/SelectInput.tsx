import type { SelectHTMLAttributes } from "react";

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition",
        "focus:border-transparent focus:ring-2 focus:ring-[#1976d2]",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
