import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type ImageAssetReferenceInput = {
  id: string;
  public_url?: string | null;
  external_url?: string | null;
};

export type ImageAssetReferenceMap = Map<string, string[]>;

type SiteSettingRow = { key: string; value: unknown };
type PostImageRow = { image_asset_id: string | null };
type NewsPostRow = { cover_image_asset_id: string | null; body: string | null; metadata: unknown };
type AssetIdRow = { image_asset_id: string | null };
type NavigationLinkRow = { icon_image_asset_id: string | null; icon: string | null; metadata: unknown };
type HomeSectionRow = { config: unknown };
type DmvQuestionRow = { image_asset_id: string | null };

export async function getImageAssetBusinessReferenceMap(
  supabase: SupabaseServerClient,
  assets: ImageAssetReferenceInput[],
): Promise<ImageAssetReferenceMap> {
  const referenceMap: ImageAssetReferenceMap = new Map();
  const assetIds = new Set(assets.map((asset) => asset.id).filter(Boolean));
  const urlIndex = buildUrlIndex(assets);

  if (assets.length === 0) return referenceMap;

  const addAssetReference = (assetId: string | null | undefined, label: string) => {
    if (!assetId || !assetIds.has(assetId)) return;
    addReference(referenceMap, assetId, label);
  };

  const addTextReferences = (value: unknown, label: string) => {
    const text = stringifyReferenceValue(value);
    if (!text) return;
    for (const [url, ids] of urlIndex) {
      if (!text.includes(url)) continue;
      for (const id of ids) addReference(referenceMap, id, label);
    }
  };

  const protectAllOnError = () => {
    for (const asset of assets) addReference(referenceMap, asset.id, "引用检查暂不可用，已保护");
  };

  const { data: siteSettings, error: siteSettingsError } = await supabase
    .from("site_settings")
    .select("key,value")
    .limit(1000);
  if (siteSettingsError) {
    protectAllOnError();
  } else {
    for (const row of (siteSettings ?? []) as SiteSettingRow[]) {
      const value = row.value;
      addAssetReference(readImageAssetId(value), "正在被站点设置使用");
      addTextReferences(value, "正在被站点设置使用");
    }
  }

  const { data: postImages, error: postImagesError } = await supabase
    .from("post_images")
    .select("image_asset_id")
    .limit(10000);
  if (postImagesError) {
    protectAllOnError();
  } else {
    for (const row of (postImages ?? []) as PostImageRow[]) addAssetReference(row.image_asset_id, "正在被用户发布信息使用");
  }

  const { data: newsPosts, error: newsPostsError } = await supabase
    .from("news_posts")
    .select("cover_image_asset_id,body,metadata")
    .limit(10000);
  if (newsPostsError) {
    protectAllOnError();
  } else {
    for (const row of (newsPosts ?? []) as NewsPostRow[]) {
      addAssetReference(row.cover_image_asset_id, "正在被新闻封面使用");
      addTextReferences(row.body, "正在被新闻内容使用");
      addTextReferences(row.metadata, "正在被新闻内容使用");
    }
  }

  const { data: ads, error: adsError } = await supabase
    .from("ads")
    .select("image_asset_id,metadata")
    .limit(10000);
  if (adsError) {
    protectAllOnError();
  } else {
    for (const row of (ads ?? []) as Array<AssetIdRow & { metadata: unknown }>) {
      addAssetReference(row.image_asset_id, "正在被广告使用");
      addTextReferences(row.metadata, "正在被广告使用");
    }
  }

  const { data: homeBanners, error: homeBannersError } = await supabase
    .from("home_banners")
    .select("image_asset_id")
    .limit(10000);
  if (homeBannersError) {
    protectAllOnError();
  } else {
    for (const row of (homeBanners ?? []) as AssetIdRow[]) addAssetReference(row.image_asset_id, "正在被首页配置使用");
  }

  const { data: topQuickLinks, error: topQuickLinksError } = await supabase
    .from("top_quick_links")
    .select("image_asset_id,icon")
    .limit(10000);
  if (topQuickLinksError) {
    protectAllOnError();
  } else {
    for (const row of (topQuickLinks ?? []) as Array<AssetIdRow & { icon: string | null }>) {
      addAssetReference(row.image_asset_id, "正在被首页配置使用");
      addTextReferences(row.icon, "正在被首页配置使用");
    }
  }

  const { data: homeSections, error: homeSectionsError } = await supabase
    .from("home_sections")
    .select("config")
    .limit(10000);
  if (homeSectionsError) {
    protectAllOnError();
  } else {
    for (const row of (homeSections ?? []) as HomeSectionRow[]) addTextReferences(row.config, "正在被首页配置使用");
  }

  const { data: navigationLinks, error: navigationLinksError } = await supabase
    .from("navigation_links")
    .select("icon_image_asset_id,icon,metadata")
    .limit(10000);
  if (navigationLinksError) {
    protectAllOnError();
  } else {
    for (const row of (navigationLinks ?? []) as NavigationLinkRow[]) {
      addAssetReference(row.icon_image_asset_id, "正在被公共导航使用");
      addTextReferences(row.icon, "正在被公共导航使用");
      addTextReferences(row.metadata, "正在被公共导航使用");
    }
  }

  const { data: dmvQuestions, error: dmvQuestionsError } = await supabase
    .from("dmv_questions")
    .select("image_asset_id")
    .limit(10000);
  if (dmvQuestionsError) {
    protectAllOnError();
  } else {
    for (const row of (dmvQuestions ?? []) as DmvQuestionRow[]) addAssetReference(row.image_asset_id, "正在被 DMV 题库使用");
  }

  return referenceMap;
}

function buildUrlIndex(assets: ImageAssetReferenceInput[]) {
  const index = new Map<string, Set<string>>();
  for (const asset of assets) {
    for (const url of [asset.public_url, asset.external_url]) {
      const normalized = normalizeUrl(url);
      if (!normalized) continue;
      const ids = index.get(normalized) ?? new Set<string>();
      ids.add(asset.id);
      index.set(normalized, ids);
    }
  }
  return index;
}

function addReference(referenceMap: ImageAssetReferenceMap, assetId: string, label: string) {
  const labels = referenceMap.get(assetId) ?? [];
  if (!labels.includes(label)) labels.push(label);
  referenceMap.set(assetId, labels);
}

function readImageAssetId(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const imageAssetId = record.imageAssetId ?? record.image_asset_id;
  return typeof imageAssetId === "string" && imageAssetId.trim() ? imageAssetId.trim() : null;
}

function stringifyReferenceValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function normalizeUrl(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
