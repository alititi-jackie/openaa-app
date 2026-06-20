import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PublicAdRow = {
  id: string;
  placement: string;
  title: string;
  href: string | null;
  open_mode: "internal" | "external_new" | "external_same";
  link_type: "internal" | "external";
  external_url: string | null;
  slug: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  image_assets?: { public_url: string | null; external_url: string | null } | Array<{ public_url: string | null; external_url: string | null }> | null;
};

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ state: "missing_config", data: [], error: "missing_config" }, { status: 503 });
  }

  const url = new URL(request.url);
  const placement = normalizePlacement(url.searchParams.get("placement"));
  const now = new Date().toISOString();
  let query = supabase
    .from("ads")
    .select("id,placement,title,href,open_mode,link_type,external_url,slug,is_active,sort_order,starts_at,ends_at,image_assets(public_url,external_url)")
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(readLimit(url));

  if (placement) {
    query = query.eq("placement", placement);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ state: "error", data: [], error: "query_error" }, { status: 500 });
  }

  return NextResponse.json({ state: "ready", data: ((data ?? []) as PublicAdRow[]).map(mapAd) });
}

function mapAd(row: PublicAdRow) {
  const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
  return {
    id: row.id,
    placement: row.placement,
    position: row.placement,
    title: row.title,
    href: row.href,
    link_url: row.href,
    link_type: row.link_type,
    external_url: row.external_url,
    slug: row.slug,
    open_mode: row.open_mode,
    openMode: row.open_mode,
    image_url: imageAsset?.public_url || imageAsset?.external_url || null,
    imageUrl: imageAsset?.public_url || imageAsset?.external_url || null,
  };
}

function normalizePlacement(value: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "";
}

function readLimit(url: URL) {
  const parsed = Number(url.searchParams.get("limit") ?? 20);
  return Number.isFinite(parsed) ? Math.min(50, Math.max(1, Math.floor(parsed))) : 20;
}
