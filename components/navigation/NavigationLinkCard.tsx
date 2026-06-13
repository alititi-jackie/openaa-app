import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { NavigationLink } from "@/features/navigation/types";
import { OPENAA_INTERNAL_HOSTS } from "@/features/navigation/constants";

function isExternalTarget(url: string, openMode: NavigationLink["openMode"]) {
  if (openMode === "same") return false;
  if (openMode === "new") return !url.startsWith("/");
  if (url.startsWith("/") || url.startsWith("#")) return false;

  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return !OPENAA_INTERNAL_HOSTS.some((host) => {
      const normalized = host.toLowerCase().replace(/^www\./, "");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

export function NavigationLinkCard({ link }: { link: NavigationLink }) {
  const external = isExternalTarget(link.url, link.openMode);
  const className = "group block rounded-2xl bg-zinc-50 px-3 py-3 ring-1 ring-zinc-100 transition hover:bg-white hover:ring-zinc-200";
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[12.5px] font-bold text-zinc-900" title={link.title}>
          {link.title}
        </div>
        {external ? <ExternalLink size={13} className="shrink-0 text-zinc-400" aria-label="外部链接" /> : null}
      </div>
      {link.description ? <div className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{link.description}</div> : null}
    </>
  );

  if (external) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={link.url} className={className}>
      {content}
    </Link>
  );
}
