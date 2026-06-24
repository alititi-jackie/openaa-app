import { notFound } from "next/navigation";
import { AdDetailClient } from "@/components/ads/AdDetailClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getAdPlaceholderSetting } from "@/features/ads/placeholders";

export const dynamic = "force-dynamic";

type AdDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type RawAdDetail = {
  title: string;
  slug: string;
  content: string | null;
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  address: string | null;
  image_assets?: { public_url: string | null; external_url: string | null } | Array<{ public_url: string | null; external_url: string | null }> | null;
};

export async function generateMetadata({ params }: AdDetailPageProps) {
  const { slug } = await params;
  return buildPageMetadata({
    title: slug,
    description: "OpenAA 广告详情。",
    path: `/ads/${slug}`,
    noIndex: true,
  });
}

export default async function AdDetailPage({ params }: AdDetailPageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ads")
    .select("title,slug,content,contact_name,phone,wechat,address,image_assets(public_url,external_url)")
    .eq("slug", slug)
    .eq("link_type", "internal")
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .maybeSingle();

  if (error || !data) notFound();

  const ad = mapAdDetail(data as RawAdDetail);
  const adPlaceholder = await getAdPlaceholderSetting(supabase);

  return <AdDetailClient ad={ad} fallbackImageUrl={adPlaceholder.imageUrl} />;
}

function mapAdDetail(row: RawAdDetail) {
  const imageAsset = Array.isArray(row.image_assets) ? row.image_assets[0] : row.image_assets;
  return {
    imageUrl: imageAsset?.public_url || imageAsset?.external_url || "",
    slug: row.slug,
    title: row.title || row.slug,
    content: row.content,
    contactName: row.contact_name,
    phone: row.phone,
    wechat: row.wechat,
    address: row.address,
  };
}
