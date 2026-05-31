import Link from "next/link";
import { PlusCircle } from "lucide-react";

export function PublishCta({ returnTo, label = "发布信息" }: { returnTo: string; label?: string }) {
  return (
    <Link
      href={`${returnTo}/publish`}
      className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
    >
      <PlusCircle size={18} aria-hidden="true" />
      {label}
    </Link>
  );
}
