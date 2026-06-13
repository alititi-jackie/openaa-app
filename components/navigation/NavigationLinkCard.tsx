import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Globe2, Star } from "lucide-react";
import type { NavigationLink } from "@/features/navigation/types";
import { cn } from "@/lib/utils/cn";

function isExternalUrl(url: string) {
  return url.startsWith("https://");
}

function displayHost(url: string) {
  if (!isExternalUrl(url)) return url;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "外部链接";
  }
}

export function NavigationLinkCard({ link, featured = false }: { link: NavigationLink; featured?: boolean }) {
  const external = isExternalUrl(link.url);
  const iconText = link.icon?.trim().slice(0, 2);

  const content = (
    <article
      className={cn(
        "group h-full rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
        featured ? "border-blue-100" : "border-slate-100",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl", featured ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600")}>
          {link.imageUrl ? (
            <Image src={link.imageUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
          ) : iconText ? (
            <span className="text-xs font-black">{iconText}</span>
          ) : (
            <Globe2 size={18} aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-slate-950">{link.title}</h3>
              {link.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{link.description}</p> : null}
            </div>
            <span className="mt-0.5 flex shrink-0 items-center gap-1 text-slate-400">
              {link.isFeatured ? <Star size={14} aria-label="推荐" /> : null}
              {external ? <ExternalLink size={14} aria-label="外部链接" /> : null}
            </span>
          </div>
          <p className="mt-2 truncate text-[11px] font-semibold text-slate-400">{displayHost(link.url)}</p>
        </div>
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block h-full">
        {content}
      </a>
    );
  }

  return (
    <Link href={link.url} className="block h-full">
      {content}
    </Link>
  );
}
