import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Globe2 } from "lucide-react";
import type { NavigationLink } from "@/features/navigation/types";
import { cn } from "@/lib/utils/cn";

function isExternalUrl(url: string) {
  return url.startsWith("https://");
}

export function NavigationLinkCard({ link, featured = false }: { link: NavigationLink; featured?: boolean }) {
  const external = isExternalUrl(link.url);
  const iconText = link.icon?.trim().slice(0, 2);

  const content = (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl border bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
        featured ? "border-blue-100" : "border-slate-100",
      )}
    >
      <div className={cn("relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl", featured ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600")}>
        {link.imageUrl ? (
          <Image src={link.imageUrl} alt="" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-contain" />
        ) : iconText ? (
          <span className="px-2 text-center text-3xl font-black leading-none sm:text-4xl">{iconText}</span>
        ) : (
          <Globe2 className="h-2/5 w-2/5" aria-hidden="true" />
        )}
        {external ? (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-400 shadow-sm">
            <ExternalLink size={14} aria-label="外部链接" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 px-1 pb-1 pt-2">
        <h3 className="truncate text-sm font-black leading-5 text-slate-950">{link.title}</h3>
        <p className="mt-1 truncate text-xs leading-5 text-slate-500">{link.description || "常用导航入口"}</p>
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
