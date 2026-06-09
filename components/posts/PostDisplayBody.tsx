import { CONTACT_SOURCE_HINT_TEXT, ContactSourceHint } from "./ContactSourceHint";

type PostDisplayBodyProps = {
  body: string;
  footerLine?: string;
  clampLines?: 2;
  bodyClassName?: string;
  hintClassName?: string;
};

export function PostDisplayBody({ body, footerLine, clampLines, bodyClassName, hintClassName }: PostDisplayBodyProps) {
  if (clampLines === 2) {
    if (footerLine) {
      return (
        <div className={["mt-4 text-base leading-relaxed text-gray-600", bodyClassName].filter(Boolean).join(" ")}>
          <p className="line-clamp-2 overflow-hidden break-words [overflow-wrap:anywhere]">{body}</p>
          <p className={["mt-1 text-zinc-500", hintClassName].filter(Boolean).join(" ")}>{footerLine}</p>
          <p className={["mt-1 text-zinc-500", hintClassName].filter(Boolean).join(" ")}>{CONTACT_SOURCE_HINT_TEXT}</p>
        </div>
      );
    }

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
        {[body, footerLine, CONTACT_SOURCE_HINT_TEXT].filter(Boolean).join("\n")}
      </p>
    );
  }

  return (
    <>
      <p className={["mt-4 whitespace-pre-wrap break-words text-base leading-relaxed text-gray-600 [overflow-wrap:anywhere]", bodyClassName].filter(Boolean).join(" ")}>{body}</p>
      {footerLine ? <p className={["mt-2 text-base leading-relaxed text-zinc-500", hintClassName].filter(Boolean).join(" ")}>{footerLine}</p> : null}
      <ContactSourceHint className={["text-base", hintClassName].filter(Boolean).join(" ")} />
    </>
  );
}
