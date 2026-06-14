import "server-only";

import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 24;

export type ImageCleanupFilter = "deletable" | "protected" | "deleted" | "all";
export type ImageSourceFilter = "all" | "storage" | "external";

export type AdminImageAssetItem = {
  id: string;
  sourceType: "storage" | "external";
  bucket: string | null;
  path: string | null;
  publicUrl: string | null;
  externalUrl: string | null;
  displayUrl: string | null;
  externalHost: string | null;
  ownerId: string | null;
  entityType: string | null;
  entityId: string | null;
  status: "active" | "orphaned" | "deleted";
  isPublic: boolean;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  referenceLabels: string[];
  protectionReasons: string[];
  cleanupRisk: "protected" | "low" | "medium";
  cleanupHint: string;
  isProbablyUnused: boolean;
};

export type AdminImageCleanupData = {
  state: "ready" | "missing_config" | "error";
  error?: string;
  permissions: {
    viewImages: boolean;
    manageImageAssets: boolean;
    deleteImages: boolean;
  };
  assets: AdminImageAssetItem[];
  totals: {
    total: number;
    deletable: number;
    protected: number;
    deleted: number;
    currentPage: number;
  };
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
};

type RawImageAsset = {
  id: string;
  source_type: "storage" | "external";
  bucket: string | null;
  path: string | null;
  public_url: string | null;
  external_url: string | null;
  external_host: string | null;
  owner_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: "active" | "orphaned" | "deleted";
  is_public: boolean;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function getAdminImageCleanupData({
  filter = "deletable",
  source = "all",
  q,
  page = 1,
}: {
  filter?: ImageCleanupFilter;
  source?: ImageSourceFilter;
  q?: string;
  page?: number;
} = {}): Promise<AdminImageCleanupData> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getImageCleanupPermissions();
  const normalizedPage = Math.max(1, page);

  if (!permissions.viewImages && !permissions.manageImageAssets) return emptyResult("ready", permissions, normalizedPage);
  if (!supabase) return emptyResult("missing_config", permissions, normalizedPage, "Supabase 环境变量未配置，暂时无法读取图片资产。");

  const postImageIds = permissions.manageImageAssets ? await getReferencedPostImageAssetIds(supabase) : new Set<string>();
  const totals = await getImageAssetTotals(supabase, postImageIds);

  const baseQuery = () =>
    supabase
    .from("image_assets")
    .select("id,source_type,bucket,path,public_url,external_url,external_host,owner_id,entity_type,entity_id,status,is_public,size_bytes,width,height,created_at,updated_at,deleted_at", { count: "exact" })
    .order("created_at", { ascending: false });

  let query = baseQuery();
  if (source !== "all") query = query.eq("source_type", source);
  if (filter === "deleted") query = query.eq("status", "deleted");
  if (filter === "protected") query = query.neq("status", "deleted").not("entity_id", "is", null);
  if (filter === "deletable") query = query.neq("status", "deleted").is("entity_id", null);

  const search = q?.trim();
  if (search) {
    const escaped = escapeLike(search.replaceAll(",", " "));
    const filters = [`bucket.ilike.%${escaped}%`, `path.ilike.%${escaped}%`, `external_url.ilike.%${escaped}%`, `external_host.ilike.%${escaped}%`, `entity_type.ilike.%${escaped}%`];
    if (isUuid(search)) {
      filters.push(`id.eq.${search}`, `entity_id.eq.${search}`, `owner_id.eq.${search}`);
    }
    query = query.or(filters.join(","));
  }

  if (filter === "deletable") {
    const { data, error } = await query.limit(5000);
    if (error) return emptyResult("error", permissions, normalizedPage, "图片资产读取失败，请稍后再试。");

    const allDeletableAssets = ((data ?? []) as RawImageAsset[])
      .map((row) => mapImageAsset(row, postImageIds))
      .filter((asset) => asset.isProbablyUnused);
    const from = (normalizedPage - 1) * PAGE_SIZE;
    const filteredAssets = allDeletableAssets.slice(from, from + PAGE_SIZE);

    return {
      state: "ready",
      permissions,
      assets: filteredAssets,
      totals: {
        ...totals,
        currentPage: filteredAssets.length,
      },
      page: normalizedPage,
      pageSize: PAGE_SIZE,
      pageCount: Math.max(1, Math.ceil(allDeletableAssets.length / PAGE_SIZE)),
      totalCount: allDeletableAssets.length,
    };
  }

  const from = (normalizedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return emptyResult("error", permissions, normalizedPage, "图片资产读取失败，请稍后再试。");

  const assets = ((data ?? []) as RawImageAsset[]).map((row) => mapImageAsset(row, postImageIds));
  const filteredAssets = assets;
  const totalCount = count ?? 0;

  return {
    state: "ready",
    permissions,
    assets: filteredAssets,
    totals: {
      ...totals,
      currentPage: filteredAssets.length,
    },
    page: normalizedPage,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  };
}

export function normalizeImageCleanupFilter(value?: string): ImageCleanupFilter {
  if (value === "protected" || value === "deleted" || value === "all" || value === "deletable") return value;
  return "deletable";
}

export function normalizeImageSourceFilter(value?: string): ImageSourceFilter {
  if (value === "storage" || value === "external" || value === "all") return value;
  return "all";
}

async function getImageCleanupPermissions() {
  const [viewImages, manageImageAssets, deleteImages] = await Promise.all([
    hasAdminPermission("view_images"),
    hasAdminPermission("manage_image_assets"),
    hasAdminPermission("delete_images"),
  ]);
  return { viewImages, manageImageAssets, deleteImages };
}

async function getReferencedPostImageAssetIds(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const { data, error } = await supabase.from("post_images").select("image_asset_id").limit(5000);
  if (error || !data) return new Set<string>();
  return new Set(data.map((row) => String(row.image_asset_id)).filter(Boolean));
}

async function getImageAssetTotals(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, postImageIds: Set<string>) {
  const { data, error } = await supabase.from("image_assets").select("id,entity_id,status").limit(5000);
  if (error || !data) return { total: 0, deletable: 0, protected: 0, deleted: 0 };

  let deletable = 0;
  let protectedCount = 0;
  let deleted = 0;
  for (const row of data as Array<{ id: string; entity_id: string | null; status: string }>) {
    if (row.status === "deleted") {
      deleted += 1;
      continue;
    }
    if (!row.entity_id && !postImageIds.has(row.id)) {
      deletable += 1;
    } else {
      protectedCount += 1;
    }
  }
  return { total: data.length, deletable, protected: protectedCount, deleted };
}

function mapImageAsset(row: RawImageAsset, postImageIds: Set<string>): AdminImageAssetItem {
  const references: string[] = [];
  const protectionReasons: string[] = [];
  if (row.entity_type && row.entity_id) {
    references.push(`${formatEntityType(row.entity_type)}：${row.entity_id}`);
    protectionReasons.push(`已绑定 ${formatEntityType(row.entity_type)} 业务记录`);
  }
  if (postImageIds.has(row.id)) {
    references.push("用户帖子图片");
    protectionReasons.push("仍被用户帖子图片表引用");
  }
  const isProbablyUnused = row.status !== "deleted" && references.length === 0;
  const cleanupRisk = !isProbablyUnused ? "protected" : row.source_type === "external" ? "low" : "medium";
  const cleanupHint = !isProbablyUnused
    ? "这张图片仍有业务引用，清理工具不会提供删除入口。"
    : row.source_type === "external"
      ? "外部图片只会标记 image_assets 记录，不会删除 img.openaa.com 原图。"
      : "Storage 图片只会标记资产记录为 deleted，本工具不会物理删除文件。";

  return {
    id: row.id,
    sourceType: row.source_type,
    bucket: row.bucket,
    path: row.path,
    publicUrl: row.public_url,
    externalUrl: row.external_url,
    displayUrl: row.public_url || row.external_url,
    externalHost: row.external_host,
    ownerId: row.owner_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    isPublic: row.is_public,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    referenceLabels: references,
    protectionReasons,
    cleanupRisk,
    cleanupHint,
    isProbablyUnused,
  };
}

function formatEntityType(value: string) {
  if (value === "ad") return "广告";
  if (value === "home_banner") return "首页 Banner";
  if (value === "news_post") return "新闻";
  if (value === "navigation_link") return "导航链接";
  if (value === "site_setting") return "站点设置";
  if (value === "post") return "用户帖子";
  return value;
}

function emptyResult(
  state: AdminImageCleanupData["state"],
  permissions: AdminImageCleanupData["permissions"],
  page: number,
  error?: string,
): AdminImageCleanupData {
  return {
    state,
    error,
    permissions,
    assets: [],
    totals: { total: 0, deletable: 0, protected: 0, deleted: 0, currentPage: 0 },
    page,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    totalCount: 0,
  };
}

function escapeLike(value: string) {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
