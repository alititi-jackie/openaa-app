import type { TextareaHTMLAttributes } from "react";

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-32 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition",
        "placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#1976d2]",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
