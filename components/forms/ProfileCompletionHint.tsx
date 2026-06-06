import Link from "next/link";

type ProfileCompletionHintProps = {
  message: string;
  href?: string;
  linkLabel?: string;
};

export function ProfileCompletionHint({ message, href, linkLabel }: ProfileCompletionHintProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
      <span>{message}</span>
      {href && linkLabel ? (
        <Link href={href} className="ml-2 font-bold text-slate-700 underline-offset-2 hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
