import type { TextareaHTMLAttributes } from "react";

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition",
        "placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-100",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
