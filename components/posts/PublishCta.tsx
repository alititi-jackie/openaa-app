import Link from "next/link";
import { PlusCircle } from "lucide-react";

export function PublishCta({ returnTo, label = "发布信息" }: { returnTo: string; label?: string }) {
  return (
    <Link
      href={`${returnTo}/publish`}
      className="inline-flex min-h-9 w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700"
    >
      <PlusCircle size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
