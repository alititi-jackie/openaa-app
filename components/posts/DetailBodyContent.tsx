import { ContactSourceHint } from "./ContactSourceHint";

type DetailBodyContentProps = {
  body: string;
  bodyClassName?: string;
  hintClassName?: string;
};

export function DetailBodyContent({ body, bodyClassName, hintClassName }: DetailBodyContentProps) {
  return (
    <>
      <p className={["mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-600", bodyClassName].filter(Boolean).join(" ")}>{body}</p>
      <ContactSourceHint className={["text-base", hintClassName].filter(Boolean).join(" ")} />
    </>
  );
}
