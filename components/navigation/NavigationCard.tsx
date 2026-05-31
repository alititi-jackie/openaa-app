import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Globe2, Star } from "lucide-react";
import type { NavigationLink } from "@/features/navigation/types";

function isExternalUrl(url: string) {
  return url.startsWith("https://");
}

export function NavigationCard({ link, compact = false }: { link: NavigationLink; compact?: boolean }) {
  const external = isExternalUrl(link.url);
  const target = external || link.openMode === "new" ? "_blank" : undefined;
  const rel = target ? "noopener noreferrer" : undefined;
  const content = (
    <article className="h-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 text-blue-700">
          {link.imageUrl ? (
            <Image src={link.imageUrl} alt="" width={44} height={44} className="h-full w-full object-cover" />
          ) : link.icon ? (
            <span className="text-xs font-black">{link.icon.slice(0, 2)}</span>
          ) : (
            <Globe2 size={20} aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-blue-700">{link.categoryName}</p>
              <h2 className="mt-1 line-clamp-2 font-black text-slate-950">{link.title}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-slate-400">
              {link.isFeatured ? <Star size={16} aria-label="推荐" /> : null}
              {external ? <ExternalLink size={16} aria-label="外部链接" /> : null}
            </div>
          </div>
          {compact ? null : <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{link.description || "常用导航入口"}</p>}
          <p className="mt-2 truncate text-xs font-semibold text-slate-400">{external ? new URL(link.url).hostname : link.url}</p>
        </div>
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={link.url} target={target} rel={rel} className="block h-full">
        {content}
      </a>
    );
  }

  return (
    <Link href={link.url} target={target} rel={rel} className="block h-full">
      {content}
    </Link>
  );
}
