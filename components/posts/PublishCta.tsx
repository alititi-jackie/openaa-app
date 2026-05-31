import Link from "next/link";
import { PlusCircle } from "lucide-react";

export function PublishCta({ returnTo, label = "发布信息" }: { returnTo: string; label?: string }) {
  return (
    <Link
      href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm"
    >
      <PlusCircle size={18} aria-hidden="true" />
      {label}
    </Link>
  );
}
