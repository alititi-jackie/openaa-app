import "server-only";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import { DEFAULT_CITY_SLUG, POST_TYPE_TO_ROUTE, PUBLIC_POST_TYPES } from "@/features/posts/constants";
import type { PostType } from "@/features/posts/types";

const PAGE_SIZE = 500;
const MAX_SITEMAP_ENTRIES = 45_000;

export async function getSitemapContentEntries() {
  const supabase = createSupabasePublicClient({ timeoutMs: 5000, revalidate: 3600 });
  if (!supabase) return [];
  const now = new Date().toISOString();
  const entries: Array<{ href: string; updatedAt: string }> = [];

  for (let offset = 0; offset < MAX_SITEMAP_ENTRIES; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from("news_posts")
      .select("slug,updated_at,published_at,created_at")
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${now}`)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.slug) entries.push({ href: `/news/${row.slug}`, updatedAt: row.updated_at ?? row.published_at ?? row.created_at });
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }

  for (let offset = 0; entries.length < MAX_SITEMAP_ENTRIES; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from("posts")
      .select("id,post_type,updated_at,published_at,created_at,cities!inner(slug)")
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("cities.slug", DEFAULT_CITY_SLUG)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .in("post_type", PUBLIC_POST_TYPES)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (PUBLIC_POST_TYPES.includes(row.post_type as PostType)) {
        entries.push({ href: `${POST_TYPE_TO_ROUTE[row.post_type as PostType]}/${row.id}`, updatedAt: row.updated_at ?? row.published_at ?? row.created_at });
      }
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }
  return entries;
}
