export const CONTACT_SOURCE_HINT_TEXT = "联系对方时，请说明是在 OpenAA 平台看到的信息。谢谢！";

export function ContactSourceHint({ className }: { className?: string }) {
  return (
    <p className={["mt-2 text-base leading-relaxed text-zinc-500", className].filter(Boolean).join(" ")}>
      {CONTACT_SOURCE_HINT_TEXT}
    </p>
  );
}
