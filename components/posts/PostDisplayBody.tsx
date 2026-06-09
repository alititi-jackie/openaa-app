import { CONTACT_SOURCE_HINT_TEXT, ContactSourceHint } from "./ContactSourceHint";

type PostDisplayBodyProps = {
  body: string;
  clampLines?: 2;
  bodyClassName?: string;
  hintClassName?: string;
};

export function PostDisplayBody({ body, clampLines, bodyClassName, hintClassName }: PostDisplayBodyProps) {
  if (clampLines === 2) {
    return (
      <p
        className={[
          "mt-4 whitespace-pre-line text-base leading-relaxed text-gray-600",
          "line-clamp-2 overflow-hidden break-words [overflow-wrap:anywhere]",
          bodyClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {[body, CONTACT_SOURCE_HINT_TEXT].filter(Boolean).join("\n")}
      </p>
    );
  }

  return (
    <>
      <p className={["mt-4 whitespace-pre-wrap break-words text-base leading-relaxed text-gray-600 [overflow-wrap:anywhere]", bodyClassName].filter(Boolean).join(" ")}>{body}</p>
      <ContactSourceHint className={["text-base", hintClassName].filter(Boolean).join(" ")} />
    </>
  );
}
