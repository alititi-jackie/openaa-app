import "server-only";

import { hasAdminModule, hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveNotificationTemplates } from "@/features/notifications/service";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE, PUBLIC_POST_TYPES } from "./constants";
import type { PostStatus, PostType, QueryState } from "./types";

export type AdminPostsPermissions = {
  viewPosts: boolean;
  moderatePosts: boolean;
  approvePosts: boolean;
  rejectPosts: boolean;
  hidePosts: boolean;
  restorePosts: boolean;
  deletePosts: boolean;
};

export type AdminPostListItem = {
  id: string;
  type: PostType;
  typeLabel: string;
  status: PostStatus;
  title: string;
  summary: string;
  category: string | null;
  visibility: string;
  authorId: string | null;
  authorLabel: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  href: string;
  locationLabel: string;
  viewCount: number;
  imageCount: number;
  contactSummary: string;
  publiclyVisible: boolean;
  lastAdminAction: string | null;
  lastAdminActionAt: string | null;
  lastAdminActionBy: string | null;
  lastAdminActionTemplateKey: string | null;
  lastAdminActionReason: string | null;
};

export type AdminPostDetailEvent = {
  id: string;
  eventType: string;
  templateKey: string | null;
  statusBefore: string | null;
  statusAfter: string | null;
  title: string | null;
  body: string | null;
  actorId: string | null;
  createdAt: string;
};

export type AdminPostDetail = AdminPostListItem & {
  body: string;
  images: Array<{ url: string; caption?: string | null; imageAssetId?: string | null }>;
  contact: {
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    wechat: string | null;
    whatsapp: string | null;
    preferred_contact_method: string | null;
  } | null;
  favoriteCount: number;
  reportCount: number;
  events: AdminPostDetailEvent[];
  canViewContact: boolean;
};

export type AdminPostNotificationTemplate = {
  key: string;
  title: string;
  body: string;
};

type AdminPostsResult = {
  state: QueryState;
  permissions: AdminPostsPermissions;
  posts: AdminPostListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  error?: string;
};

type AdminPostDetailResult = {
  state: QueryState;
  permissions: AdminPostsPermissions;
  canRead: boolean;
  canViewContact: boolean;
  post: AdminPostDetail | null;
  error?: string;
};

type AdminPostRecord = {
  id: string;
  post_type: PostType;
  author_id: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  status: PostStatus;
  visibility: string;
  cities?: { name: string | null; slug: string | null }[] | { name: string | null; slug: string | null } | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  last_admin_action: string | null;
  last_admin_action_at: string | null;
  last_admin_action_by: string | null;
  last_admin_action_template_key: string | null;
  last_admin_action_reason: string | null;
  post_contacts?: PostContactSummary[] | PostContactSummary | null;
  post_images?: Array<{ id: string | null }> | null;
  post_stats?: { view_count: number | null }[] | { view_count: number | null } | null;
};

type PostContactSummary = {
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  wechat: string | null;
  whatsapp?: string | null;
  preferred_contact_method?: string | null;
};

type AdminPostDetailRecord = Omit<AdminPostRecord, "post_images" | "post_stats"> & {
  post_images?: Array<{
    image_asset_id: string | null;
    sort_order: number | null;
    caption: string | null;
    image_assets?: unknown;
  }> | null;
  post_stats?: { view_count: number | null; favorite_count: number | null; report_count: number | null }[] | { view_count: number | null; favorite_count: number | null; report_count: number | null } | null;
};

type AdminPostEventRecord = {
  id: string;
  event_type: string;
  template_key: string | null;
  status_before: string | null;
  status_after: string | null;
  title: string | null;
  body: string | null;
  actor_id: string | null;
  created_at: string;
};

export type AdminPostsParams = {
  type?: PostType | "all";
  status?: PostStatus | "all";
  q?: string;
  authorId?: string;
  page?: number;
};

const ADMIN_POSTS_PAGE_SIZE = 20;
const RECYCLE_BIN_LIMIT = 200;
const MANAGED_POST_TYPES: PostType[] = PUBLIC_POST_TYPES;

export type RecycleBinFilter = "all" | "job" | "housing" | "marketplace" | "service" | "news" | "expired" | "with_images" | "image_error" | "orphan_favorites";
export type RecycleBinNewsFilter = "all" | "expired" | "with_images" | "image_error";
export type RecycleBinContentType = PostType | "news";

export type RecycleBinItem = {
  id: string;
  contentType: "post" | "news";
  type: RecycleBinContentType;
  typeLabel: string;
  title: string;
  status: PostStatus | "deleted";
  deletedAt: string | null;
  deletedSource: "user" | "admin" | "unknown";
  imageCount: number;
  purgeAt: string | null;
  href: string;
  hasImageError: boolean;
  imageError: string | null;
  imageErrorAt: string | null;
};

export type RecycleBinRetentionSettings = {
  userRetentionDays: number;
  adminRetentionDays: number;
};

export type RecycleBinNewsRetentionSettings = {
  newsRetentionDays: number;
};


export type RecycleBinPostDetail = RecycleBinItem & {
  summary: string;
  body: string;
  images: Array<{ url: string; caption?: string | null; imageAssetId?: string | null }>;
  contact: {
    contact_name: string | null;
    phone: string | null;
    wechat: string | null;
    email: string | null;
    preferred_contact_method: string | null;
  } | null;
};

type RecycleBinNewsRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_asset_id: string | null;
  status: "deleted";
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_error: string | null;
  deletion_error_at: string | null;
  updated_at: string;
  image_assets?: unknown;
  news_categories?: { name: string | null; slug: string | null }[] | { name: string | null; slug: string | null } | null;
};

export type RecycleBinHealth = {
  overdueCount: number;
  deletedPostsWithImagesCount: number;
  possibleMissingStorageCount: number;
  orphanFavoriteCount: number;
};

export type RecycleBinNewsHealth = {
  overdueCount: number;
  newsWithImagesCount: number;
  imageErrorCount: number;
};

export type RecycleBinResult = {
  state: QueryState;
  superAdmin: boolean;
  filter: RecycleBinFilter;
  items: RecycleBinItem[];
  health: RecycleBinHealth;
  retentionSettings: RecycleBinRetentionSettings;
  error?: string;
};

export type RecycleBinNewsResult = {
  state: QueryState;
  superAdmin: boolean;
  filter: RecycleBinNewsFilter;
  items: RecycleBinItem[];
  health: RecycleBinNewsHealth;
  retentionSettings: RecycleBinNewsRetentionSettings;
  error?: string;
};

export const RECYCLE_BIN_USER_RETENTION_KEY = "recycle_bin_user_retention_days";
export const RECYCLE_BIN_ADMIN_RETENTION_KEY = "recycle_bin_admin_retention_days";
export const RECYCLE_BIN_NEWS_RETENTION_KEY = "recycle_bin_news_retention_days";
export const DEFAULT_RECYCLE_BIN_RETENTION_SETTINGS: RecycleBinRetentionSettings = {
  userRetentionDays: 30,
  adminRetentionDays: 90,
};
export const DEFAULT_RECYCLE_BIN_NEWS_RETENTION_SETTINGS: RecycleBinNewsRetentionSettings = {
  newsRetentionDays: 90,
};
export const MIN_RECYCLE_BIN_RETENTION_DAYS = 1;
export const MAX_RECYCLE_BIN_RETENTION_DAYS = 3650;

export async function getAdminPostsPermissions(): Promise<AdminPostsPermissions> {
  const [viewPosts, moderatePosts, approvePosts, rejectPosts, hidePosts, restorePosts, deletePosts] = await Promise.all([
    hasAdminPermission("view_posts"),
    hasAdminPermission("moderate_posts"),
    hasAdminPermission("approve_posts"),
    hasAdminPermission("reject_posts"),
    hasAdminPermission("hide_posts"),
    hasAdminPermission("restore_posts"),
    hasAdminPermission("delete_posts"),
  ]);

  return { viewPosts, moderatePosts, approvePosts, rejectPosts, hidePosts, restorePosts, deletePosts };
}

export async function getAdminPostNotificationTemplates(): Promise<AdminPostNotificationTemplate[]> {
  try {
    const adminSupabase = createSupabaseAdminClient();
    const templates = await getActiveNotificationTemplates(adminSupabase);
    return templates
      .filter((template) => template.target_type === "post" && template.type === "content")
      .map((template) => ({ key: template.key, title: template.title, body: template.body }));
  } catch (error) {
    console.error("[admin/user-posts] Failed to read notification templates", error);
    return [];
  }
}

export async function getAdminPostsData(params: AdminPostsParams = {}): Promise<AdminPostsResult> {
  const supabase = await createSupabaseServerClient();
  const permissions = await getAdminPostsPermissions();
  const page = normalizePage(params.page);
  const from = (page - 1) * ADMIN_POSTS_PAGE_SIZE;
  const to = from + ADMIN_POSTS_PAGE_SIZE - 1;

  if (!supabase) {
    return emptyResult("missing_config", permissions, page);
  }

  const canRead = permissions.viewPosts || permissions.moderatePosts;
  if (!canRead) {
    return emptyResult("ready", permissions, page);
  }

  let query = supabase
    .from("posts")
    .select("id,post_type,author_id,title,summary,body,category,status,visibility,published_at,created_at,updated_at,last_admin_action,last_admin_action_at,last_admin_action_by,last_admin_action_template_key,last_admin_action_reason,cities(name,slug),post_contacts(contact_name,phone,email,wechat),post_images(id),post_stats(view_count)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.type && params.type !== "all") {
    query = query.eq("post_type", params.type);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  } else {
    query = query.neq("status", "deleted");
  }

  if (params.authorId && isUuid(params.authorId)) {
    query = query.eq("author_id", params.authorId);
  }

  if (params.q) {
    const keyword = sanitizeSearchTerm(params.q);
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%,body.ilike.%${keyword}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/user-posts] Failed to read posts", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { ...emptyResult("error", permissions, page), error: "后台帖子读取失败，请稍后再试。" };
  }

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / ADMIN_POSTS_PAGE_SIZE));

  return {
    state: "ready",
    permissions,
    page,
    pageSize: ADMIN_POSTS_PAGE_SIZE,
    totalCount,
    pageCount,
    posts: ((data ?? []) as AdminPostRecord[]).map(mapAdminPost),
  };
}

export async function getAdminPostDetail(id: string): Promise<AdminPostDetailResult> {
  const permissions = await getAdminPostsPermissions();
  const superAdmin = await isSuperAdmin();
  const canRead = superAdmin || permissions.viewPosts || permissions.moderatePosts;
  const canViewContact = superAdmin || permissions.moderatePosts || (await hasAdminPermission("view_post_contacts"));

  if (!canRead) {
    return { state: "ready", permissions, canRead, canViewContact, post: null };
  }

  let adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminSupabase = createSupabaseAdminClient();
  } catch {
    return {
      state: "missing_config",
      permissions,
      canRead,
      canViewContact,
      post: null,
      error: "Supabase service role 环境变量未配置，暂时无法读取后台详情。",
    };
  }

  const { data, error } = await adminSupabase
    .from("posts")
    .select(
      `
        id,
        post_type,
        author_id,
        title,
        summary,
        body,
        category,
        status,
        visibility,
        published_at,
        created_at,
        updated_at,
        last_admin_action,
        last_admin_action_at,
        last_admin_action_by,
        last_admin_action_template_key,
        last_admin_action_reason,
        cities(name,slug),
        post_contacts(contact_name,phone,email,wechat,whatsapp,preferred_contact_method),
        post_images(
          image_asset_id,
          sort_order,
          caption,
          image_assets(public_url,external_url)
        ),
        post_stats(view_count,favorite_count,report_count)
      `,
    )
    .eq("id", id)
    .neq("status", "deleted")
    .in("post_type", MANAGED_POST_TYPES)
    .maybeSingle();

  if (error) {
    console.error("[admin/user-posts/detail] Failed to read post", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { state: "error", permissions, canRead, canViewContact, post: null, error: "用户发布信息详情读取失败，请稍后再试。" };
  }

  if (!data) {
    return { state: "ready", permissions, canRead, canViewContact, post: null };
  }

  const record = data as unknown as AdminPostDetailRecord;
  const [authorMap, events] = await Promise.all([
    fetchAdminPostAuthors(adminSupabase, [record.author_id]),
    fetchAdminPostEvents(adminSupabase, id),
  ]);

  return {
    state: "ready",
    permissions,
    canRead,
    canViewContact,
    post: mapAdminPostDetail(record, authorMap, events, canViewContact),
  };
}

export async function getRecycleBinData(filter: RecycleBinFilter = "all", postType: PostType | "all" = "all"): Promise<RecycleBinResult> {
  const superAdmin = await isSuperAdmin();
  const canReadRecycleBin = superAdmin || await hasAdminModule("recycle-bin");
  const emptyHealth: RecycleBinHealth = {
    overdueCount: 0,
    deletedPostsWithImagesCount: 0,
    possibleMissingStorageCount: 0,
    orphanFavoriteCount: 0,
  };

  if (!canReadRecycleBin) {
    return { state: "ready", superAdmin, filter, items: [], health: emptyHealth, retentionSettings: DEFAULT_RECYCLE_BIN_RETENTION_SETTINGS };
  }

  let adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminSupabase = createSupabaseAdminClient();
  } catch {
    return {
      state: "missing_config",
      superAdmin,
      filter,
      items: [],
      health: emptyHealth,
      retentionSettings: DEFAULT_RECYCLE_BIN_RETENTION_SETTINGS,
      error: "Supabase service role 环境变量未配置，回收站无法读取完整数据。",
    };
  }

  const retentionSettings = await getRecycleBinRetentionSettings(adminSupabase);

  let query = adminSupabase
    .from("posts")
    .select("id,post_type,title,status,deleted_at,deletion_source,deletion_error,deletion_error_at,updated_at")
    .eq("status", "deleted")
    .in("post_type", MANAGED_POST_TYPES)
    .order("deleted_at", { ascending: false, nullsFirst: false })
    .limit(RECYCLE_BIN_LIMIT);

  if (filter === "job" || filter === "housing" || filter === "marketplace" || filter === "service") {
    query = query.eq("post_type", filter);
  }
  if (postType !== "all") {
    query = query.eq("post_type", postType);
  }
  const { data, error } = await query;
  if (error) {
    return { state: "error", superAdmin, filter, items: [], health: emptyHealth, retentionSettings, error: "回收站读取失败，请稍后再试。" };
  }

  const postRows = (data ?? []) as RecycleBinPostRecord[];
  const allHealthRows = await readAllRecycleBinPosts(adminSupabase);
  const healthRows = postType === "all" ? allHealthRows : allHealthRows.filter((post) => post.post_type === postType);
  const imageRows = await readRecycleBinImageRows(adminSupabase, healthRows.map((post) => post.id));
  const imageCounts = countImagesByPost(imageRows);
  const health = await buildRecycleBinHealth(adminSupabase, healthRows, imageRows, retentionSettings);

  let items = postRows.map((post) => mapRecycleBinItem(post, imageCounts.get(post.id) ?? 0, retentionSettings));
  if (filter === "news") {
    const newsRows = await readAllRecycleBinNews(adminSupabase);
    const newsRetentionSettings = await getRecycleBinNewsRetentionSettings(adminSupabase);
    items = newsRows.map((news) => mapRecycleBinNewsItem(news, newsRetentionSettings)).sort(compareRecycleBinItems);
  }
  if (filter === "expired") {
    const now = Date.now();
    items = items.filter((item) => item.purgeAt ? new Date(item.purgeAt).getTime() <= now : false);
  }
  if (filter === "with_images") {
    items = items.filter((item) => item.imageCount > 0);
  }
  if (filter === "image_error") {
    items = items.filter((item) => item.hasImageError);
  }
  if (filter === "orphan_favorites") {
    items = [];
  }

  return { state: "ready", superAdmin, filter, items, health, retentionSettings };
}

export async function getRecycleBinNewsData(filter: RecycleBinNewsFilter = "all", categorySlug: string | "all" = "all"): Promise<RecycleBinNewsResult> {
  const superAdmin = await isSuperAdmin();
  const canReadRecycleBin = superAdmin || await hasAdminModule("recycle-bin");
  const emptyHealth: RecycleBinNewsHealth = {
    overdueCount: 0,
    newsWithImagesCount: 0,
    imageErrorCount: 0,
  };

  if (!canReadRecycleBin) {
    return { state: "ready", superAdmin, filter, items: [], health: emptyHealth, retentionSettings: DEFAULT_RECYCLE_BIN_NEWS_RETENTION_SETTINGS };
  }

  let adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminSupabase = createSupabaseAdminClient();
  } catch {
    return {
      state: "missing_config",
      superAdmin,
      filter,
      items: [],
      health: emptyHealth,
      retentionSettings: DEFAULT_RECYCLE_BIN_NEWS_RETENTION_SETTINGS,
      error: "Supabase service role 环境变量未配置，回收站无法读取完整数据。",
    };
  }

  const retentionSettings = await getRecycleBinNewsRetentionSettings(adminSupabase);
  const newsRows = await readAllRecycleBinNews(adminSupabase);
  const filteredNewsRows = categorySlug === "all" ? newsRows : newsRows.filter((news) => newsCategorySlug(news.news_categories) === categorySlug);
  const health = buildRecycleBinNewsHealth(filteredNewsRows, retentionSettings);
  let items = filteredNewsRows.map((news) => mapRecycleBinNewsItem(news, retentionSettings)).sort(compareRecycleBinItems);

  if (filter === "expired") {
    const now = Date.now();
    items = items.filter((item) => item.purgeAt ? new Date(item.purgeAt).getTime() <= now : false);
  }
  if (filter === "with_images") {
    items = items.filter((item) => item.imageCount > 0);
  }
  if (filter === "image_error") {
    items = items.filter((item) => item.hasImageError);
  }

  return { state: "ready", superAdmin, filter, items, health, retentionSettings };
}

export async function getRecycleBinPostDetail(id: string): Promise<{
  state: QueryState;
  superAdmin: boolean;
  post: RecycleBinPostDetail | null;
  error?: string;
}> {
  const superAdmin = await isSuperAdmin();
  const canReadRecycleBin = superAdmin || await hasAdminModule("recycle-bin");
  if (!canReadRecycleBin) {
    return { state: "ready", superAdmin, post: null };
  }

  let adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminSupabase = createSupabaseAdminClient();
  } catch {
    return {
      state: "missing_config",
      superAdmin,
      post: null,
      error: "Supabase service role 环境变量未配置，回收站无法读取完整数据。",
    };
  }

  const { data, error } = await adminSupabase
    .from("posts")
    .select(
      `
        id,
        post_type,
        title,
        summary,
        body,
        status,
        deleted_at,
        deletion_source,
        deletion_error,
        deletion_error_at,
        updated_at,
        post_images(
          image_asset_id,
          sort_order,
          caption,
          image_assets(public_url, external_url)
        ),
        post_contacts(contact_name, phone, email, wechat, preferred_contact_method)
      `,
    )
    .eq("id", id)
    .eq("status", "deleted")
    .in("post_type", MANAGED_POST_TYPES)
    .maybeSingle();

  if (error) {
    return { state: "error", superAdmin, post: null, error: "回收站详情读取失败，请稍后再试。" };
  }

  if (!data) {
    const news = await getRecycleBinNewsDetail(adminSupabase, id);
    if (news) return { state: "ready", superAdmin, post: news };
    return { state: "ready", superAdmin, post: null };
  }

  const record = data as unknown as RecycleBinPostRecord & {
    summary: string | null;
    body: string | null;
    post_images?: Array<{
      image_asset_id: string | null;
      sort_order: number | null;
      caption: string | null;
      image_assets?: unknown;
    }> | null;
    post_contacts?: RecycleBinPostDetail["contact"][] | RecycleBinPostDetail["contact"] | null;
  };
  const sortedImages = [...(record.post_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const images = sortedImages.flatMap((image) => {
    const asset = imageAssetFromRelation(image.image_assets);
    const url = typeof asset?.public_url === "string" && asset.public_url ? asset.public_url : typeof asset?.external_url === "string" ? asset.external_url : "";
    return url ? [{ url, caption: image.caption, imageAssetId: image.image_asset_id }] : [];
  });
  const contact = Array.isArray(record.post_contacts) ? (record.post_contacts[0] ?? null) : record.post_contacts ?? null;

  return {
    state: "ready",
    superAdmin,
    post: {
      ...mapRecycleBinItem(record, images.length, await getRecycleBinRetentionSettings(adminSupabase)),
      summary: record.summary ?? "",
      body: record.body ?? "",
      images,
      contact,
    },
  };
}

async function getRecycleBinNewsDetail(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, id: string): Promise<RecycleBinPostDetail | null> {
  const { data } = await adminSupabase
    .from("news_posts")
    .select(
      `
        id,
        title,
        slug,
        excerpt,
        body,
        cover_image_asset_id,
        status,
        deleted_at,
        deleted_by,
        deletion_error,
        deletion_error_at,
        updated_at,
        image_assets(source_type,public_url,external_url),
        news_categories(name,slug)
      `,
    )
    .eq("id", id)
    .eq("status", "deleted")
    .maybeSingle();

  if (!data) return null;

  const settings = await getRecycleBinNewsRetentionSettings(adminSupabase);
  const record = data as unknown as RecycleBinNewsRecord;
  const asset = imageAssetFromRelation(record.image_assets);
  const url = typeof asset?.public_url === "string" && asset.public_url ? asset.public_url : typeof asset?.external_url === "string" ? asset.external_url : "";

  return {
    ...mapRecycleBinNewsItem(record, settings),
    summary: record.excerpt ?? "",
    body: record.body ?? record.excerpt ?? "",
    images: url ? [{ url, caption: record.title, imageAssetId: record.cover_image_asset_id }] : [],
    contact: null,
  };
}

function emptyResult(state: QueryState, permissions: AdminPostsPermissions, page: number): AdminPostsResult {
  return { state, permissions, posts: [], page, pageSize: ADMIN_POSTS_PAGE_SIZE, totalCount: 0, pageCount: 1 };
}

function normalizePage(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, "").slice(0, 80);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapAdminPost(record: AdminPostRecord): AdminPostListItem {
  const contact = relationOne(record.post_contacts);
  const stats = relationOne(record.post_stats);
  const city = relationOne(record.cities);
  const viewCount = Number(stats?.view_count ?? 0);
  const imageCount = Array.isArray(record.post_images) ? record.post_images.length : 0;

  return {
    id: record.id,
    type: record.post_type,
    typeLabel: POST_TYPE_LABELS[record.post_type],
    status: record.status,
    title: record.title,
    summary: record.summary || record.body || "暂无摘要。",
    category: record.category,
    visibility: record.visibility,
    authorId: record.author_id,
    authorLabel: record.author_id ?? "未知作者",
    publishedAt: record.published_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    href: `${POST_TYPE_TO_ROUTE[record.post_type]}/${record.id}`,
    locationLabel: city?.name || city?.slug || "未填写",
    viewCount: Number.isFinite(viewCount) ? viewCount : 0,
    imageCount,
    contactSummary: contactSummary(contact),
    publiclyVisible: record.status === "published" && record.visibility === "public",
    lastAdminAction: record.last_admin_action,
    lastAdminActionAt: record.last_admin_action_at,
    lastAdminActionBy: record.last_admin_action_by,
    lastAdminActionTemplateKey: record.last_admin_action_template_key,
    lastAdminActionReason: record.last_admin_action_reason,
  };
}

function mapAdminPostDetail(
  record: AdminPostDetailRecord,
  authors: Map<string, { email: string | null; nickname: string | null }>,
  events: AdminPostDetailEvent[],
  canViewContact: boolean,
): AdminPostDetail {
  const base = mapAdminPost({
    ...record,
    post_images: record.post_images?.map((image) => ({ id: image.image_asset_id })) ?? [],
  });
  const stats = relationOne(record.post_stats);
  const contact = relationOne(record.post_contacts);
  const author = record.author_id ? authors.get(record.author_id) : null;
  const sortedImages = [...(record.post_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const images = sortedImages.flatMap((image) => {
    const asset = imageAssetFromRelation(image.image_assets);
    const url = typeof asset?.public_url === "string" && asset.public_url ? asset.public_url : typeof asset?.external_url === "string" ? asset.external_url : "";
    return url ? [{ url, caption: image.caption, imageAssetId: image.image_asset_id }] : [];
  });

  return {
    ...base,
    authorLabel: authorLabel(author, record.author_id),
    body: record.body || record.summary || "暂无正文。",
    images,
    imageCount: images.length,
    contact: canViewContact && contact
      ? {
          contact_name: contact.contact_name,
          phone: contact.phone,
          email: contact.email,
          wechat: contact.wechat,
          whatsapp: contact.whatsapp ?? null,
          preferred_contact_method: contact.preferred_contact_method ?? null,
        }
      : null,
    favoriteCount: Number(stats?.favorite_count ?? 0),
    reportCount: Number(stats?.report_count ?? 0),
    events,
    canViewContact,
  };
}

async function fetchAdminPostAuthors(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, ids: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map<string, { email: string | null; nickname: string | null }>();

  const { data } = await adminSupabase.from("profiles").select("id,email,nickname").in("id", uniqueIds);
  return new Map((data ?? []).map((profile) => [String(profile.id), { email: profile.email as string | null, nickname: profile.nickname as string | null }]));
}

async function fetchAdminPostEvents(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, postId: string): Promise<AdminPostDetailEvent[]> {
  const { data, error } = await adminSupabase
    .from("post_admin_events")
    .select("id,event_type,template_key,status_before,status_after,title,body,actor_id,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[admin/user-posts/detail] Failed to read post admin events", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return ((data ?? []) as AdminPostEventRecord[]).map((event) => ({
    id: event.id,
    eventType: event.event_type,
    templateKey: event.template_key,
    statusBefore: event.status_before,
    statusAfter: event.status_after,
    title: event.title,
    body: event.body,
    actorId: event.actor_id,
    createdAt: event.created_at,
  }));
}

function authorLabel(author: { email: string | null; nickname: string | null } | null | undefined, fallback?: string | null) {
  return author?.nickname?.trim() || author?.email?.trim() || fallback || "未知作者";
}

function relationOne<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function contactSummary(contact: PostContactSummary | null) {
  if (!contact) return "未填写";
  const parts = [contact.contact_name, contact.phone, contact.wechat, contact.email].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "未填写";
}

type RecycleBinPostRecord = {
  id: string;
  post_type: PostType;
  title: string;
  status: PostStatus;
  deleted_at: string | null;
  deletion_source: string | null;
  deletion_error: string | null;
  deletion_error_at: string | null;
  updated_at: string;
};

type RecycleBinImageRow = {
  post_id: string | null;
  image_asset_id: string | null;
  image_assets?: unknown;
};

async function readAllRecycleBinPosts(adminSupabase: ReturnType<typeof createSupabaseAdminClient>): Promise<RecycleBinPostRecord[]> {
  const { data } = await adminSupabase
    .from("posts")
    .select("id,post_type,title,status,deleted_at,deletion_source,deletion_error,deletion_error_at,updated_at")
    .eq("status", "deleted")
    .in("post_type", MANAGED_POST_TYPES)
    .limit(5000);

  return (data ?? []) as RecycleBinPostRecord[];
}

async function readAllRecycleBinNews(adminSupabase: ReturnType<typeof createSupabaseAdminClient>): Promise<RecycleBinNewsRecord[]> {
  const { data } = await adminSupabase
    .from("news_posts")
    .select("id,title,slug,excerpt,body,cover_image_asset_id,status,deleted_at,deleted_by,deletion_error,deletion_error_at,updated_at,image_assets(source_type,public_url,external_url),news_categories(name,slug)")
    .eq("status", "deleted")
    .limit(5000);

  return (data ?? []) as unknown as RecycleBinNewsRecord[];
}

async function readRecycleBinImageRows(adminSupabase: ReturnType<typeof createSupabaseAdminClient>, postIds: string[]): Promise<RecycleBinImageRow[]> {
  if (postIds.length === 0) return [];

  const { data } = await adminSupabase
    .from("post_images")
    .select("post_id,image_asset_id,image_assets(id,source_type,bucket,path,status)")
    .in("post_id", postIds);

  return (data ?? []) as RecycleBinImageRow[];
}

function countImagesByPost(rows: RecycleBinImageRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.post_id) continue;
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }
  return counts;
}

async function buildRecycleBinHealth(
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>,
  posts: RecycleBinPostRecord[],
  imageRows: RecycleBinImageRow[],
  retentionSettings: RecycleBinRetentionSettings,
): Promise<RecycleBinHealth> {
  const now = Date.now();
  const items = posts.map((post) => mapRecycleBinItem(post, 0, retentionSettings));
  const deletedPostsWithImageIds = new Set(imageRows.map((row) => row.post_id).filter((id): id is string => Boolean(id)));
  const possibleMissingStorageCount = imageRows.filter((row) => {
    const asset = imageAssetFromRelation(row.image_assets);
    return asset?.source_type === "storage" && (asset.status === "deleted" || !asset.bucket || !asset.path);
  }).length;

  return {
    overdueCount: items.filter((item) => item.purgeAt ? new Date(item.purgeAt).getTime() <= now : false).length,
    deletedPostsWithImagesCount: deletedPostsWithImageIds.size,
    possibleMissingStorageCount,
    orphanFavoriteCount: await countOrphanFavorites(adminSupabase),
  };
}

function buildRecycleBinNewsHealth(news: RecycleBinNewsRecord[], retentionSettings: RecycleBinNewsRetentionSettings): RecycleBinNewsHealth {
  const now = Date.now();
  const items = news.map((item) => mapRecycleBinNewsItem(item, retentionSettings));

  return {
    overdueCount: items.filter((item) => item.purgeAt ? new Date(item.purgeAt).getTime() <= now : false).length,
    newsWithImagesCount: items.filter((item) => item.imageCount > 0).length,
    imageErrorCount: items.filter((item) => item.hasImageError).length,
  };
}

async function countOrphanFavorites(adminSupabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await adminSupabase
    .from("user_favorites")
    .select("target_id,target_type")
    .in("target_type", ["job", "housing", "marketplace", "service", "post"])
    .limit(5000);

  const favorites = (data ?? []) as Array<{ target_id: string | null; target_type: string | null }>;
  const ids = [
    ...new Set(
      favorites.flatMap((favorite) => {
        const targetId = favorite.target_id;
        return targetId && isUuid(targetId) ? [targetId] : [];
      }),
    ),
  ];
  if (ids.length === 0) return 0;

  const { data: posts } = await adminSupabase.from("posts").select("id").in("id", ids);
  const liveIds = new Set(((posts ?? []) as Array<{ id: string }>).map((post) => post.id));
  return favorites.filter((favorite) => {
    const targetId = favorite.target_id;
    return Boolean(targetId && isUuid(targetId) && !liveIds.has(targetId));
  }).length;
}

function mapRecycleBinItem(record: RecycleBinPostRecord, imageCount: number, retentionSettings: RecycleBinRetentionSettings): RecycleBinItem {
  const source = record.deletion_source === "user" || record.deletion_source === "admin" ? record.deletion_source : "unknown";
  return {
    id: record.id,
    contentType: "post",
    type: record.post_type,
    typeLabel: POST_TYPE_LABELS[record.post_type],
    title: record.title,
    status: record.status,
    deletedAt: record.deleted_at,
    deletedSource: source,
    imageCount,
    purgeAt: record.deleted_at ? retentionDate(record.deleted_at, source, retentionSettings).toISOString() : null,
    href: `/admin/recycle-bin/post/${record.id}`,
    hasImageError: Boolean(record.deletion_error || record.deletion_error_at),
    imageError: record.deletion_error,
    imageErrorAt: record.deletion_error_at,
  };
}

function mapRecycleBinNewsItem(record: RecycleBinNewsRecord, retentionSettings: RecycleBinNewsRetentionSettings): RecycleBinItem {
  const imageUrl = imageAssetFromRelation(record.image_assets);
  return {
    id: record.id,
    contentType: "news",
    type: "news",
    typeLabel: "新闻",
    title: record.title,
    status: "deleted",
    deletedAt: record.deleted_at,
    deletedSource: record.deleted_by ? "admin" : "unknown",
    imageCount: record.cover_image_asset_id || imageUrl ? 1 : 0,
    purgeAt: record.deleted_at ? newsRetentionDate(record.deleted_at, retentionSettings).toISOString() : null,
    href: `/admin/recycle-bin/news/${record.id}`,
    hasImageError: Boolean(record.deletion_error || record.deletion_error_at),
    imageError: record.deletion_error,
    imageErrorAt: record.deletion_error_at,
  };
}

function compareRecycleBinItems(a: RecycleBinItem, b: RecycleBinItem) {
  const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
  const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function retentionDate(deletedAt: string, source: "user" | "admin" | "unknown", settings: RecycleBinRetentionSettings) {
  const days = source === "admin" ? settings.adminRetentionDays : settings.userRetentionDays;
  const date = new Date(deletedAt);
  date.setDate(date.getDate() + days);
  return date;
}

function newsRetentionDate(deletedAt: string, settings: RecycleBinNewsRetentionSettings) {
  const date = new Date(deletedAt);
  date.setDate(date.getDate() + settings.newsRetentionDays);
  return date;
}

export async function getRecycleBinRetentionSettings(adminSupabase?: ReturnType<typeof createSupabaseAdminClient>): Promise<RecycleBinRetentionSettings> {
  let supabase = adminSupabase;
  if (!supabase) {
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      return DEFAULT_RECYCLE_BIN_RETENTION_SETTINGS;
    }
  }

  const { data } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", [RECYCLE_BIN_USER_RETENTION_KEY, RECYCLE_BIN_ADMIN_RETENTION_KEY]);

  const rows = (data ?? []) as Array<{ key: string; value: unknown }>;
  return {
    userRetentionDays: normalizeRecycleBinRetentionDays(rows.find((row) => row.key === RECYCLE_BIN_USER_RETENTION_KEY)?.value, DEFAULT_RECYCLE_BIN_RETENTION_SETTINGS.userRetentionDays),
    adminRetentionDays: normalizeRecycleBinRetentionDays(rows.find((row) => row.key === RECYCLE_BIN_ADMIN_RETENTION_KEY)?.value, DEFAULT_RECYCLE_BIN_RETENTION_SETTINGS.adminRetentionDays),
  };
}

export async function getRecycleBinNewsRetentionSettings(adminSupabase?: ReturnType<typeof createSupabaseAdminClient>): Promise<RecycleBinNewsRetentionSettings> {
  let supabase = adminSupabase;
  if (!supabase) {
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      return DEFAULT_RECYCLE_BIN_NEWS_RETENTION_SETTINGS;
    }
  }

  const { data } = await supabase
    .from("site_settings")
    .select("key,value")
    .eq("key", RECYCLE_BIN_NEWS_RETENTION_KEY)
    .maybeSingle();

  return {
    newsRetentionDays: normalizeRecycleBinRetentionDays(data?.value, DEFAULT_RECYCLE_BIN_NEWS_RETENTION_SETTINGS.newsRetentionDays),
  };
}

export function normalizeRecycleBinRetentionDays(value: unknown, fallback: number) {
  let candidate: unknown = value;

  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>;
    candidate = record.days ?? record.retentionDays ?? record.value;
  }

  const parsed = typeof candidate === "number" ? candidate : typeof candidate === "string" ? Number(candidate) : Number.NaN;
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return fallback;
  return Math.min(MAX_RECYCLE_BIN_RETENTION_DAYS, Math.max(MIN_RECYCLE_BIN_RETENTION_DAYS, parsed));
}

function imageAssetFromRelation(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  return value as Record<string, unknown>;
}

function newsCategorySlug(value: RecycleBinNewsRecord["news_categories"]) {
  if (!value) return null;
  const category = Array.isArray(value) ? value[0] : value;
  return category?.slug ?? null;
}
