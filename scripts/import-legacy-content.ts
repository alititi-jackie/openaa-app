import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type EnvName = "local" | "staging" | "production";
type ModuleName = "navigation" | "news" | "ads" | "ticker" | "top-links" | "home" | "all";

type CliOptions = {
  moduleName: ModuleName;
  env: EnvName;
  dryRun: boolean;
  apply: boolean;
};

type Plan = {
  moduleName: ModuleName;
  file: string;
  create: number;
  update: number;
  skip: number;
  warnings: string[];
  reviewStats?: Record<string, number>;
};

type ApplyStats = {
  moduleName: ModuleName;
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

type JsonRecord = Record<string, unknown>;
type LegacyMetadata = JsonRecord & { source?: string; origin?: string; approved_for?: string; notes?: unknown };
type LegacyFile = JsonRecord & { metadata?: LegacyMetadata };
type LegacyNavigationCategory = JsonRecord & { slug: string; name: string; description?: string; icon?: string; sort_order: number; is_active: boolean; legacy_id?: string; metadata?: JsonRecord };
type LegacyNavigationLink = JsonRecord & { legacy_id: string; category_slug: string; title: string; description?: string; url: string; icon?: string; image_url?: string | null; sort_order: number; is_active: boolean; is_featured?: boolean; metadata?: JsonRecord };
type LegacyTopLink = JsonRecord & { legacy_id: string; title: string; href: string; icon?: string; open_mode: string; sort_order: number; is_active: boolean; metadata?: JsonRecord };
type LegacyTickerSection = JsonRecord & { legacy_id: string; title: string; href: string; module: string; is_enabled: boolean; sort_order: number; display_count?: number; starts_at?: string | null; ends_at?: string | null; metadata?: JsonRecord };
type LegacyNewsCategory = JsonRecord & { legacy_id: string; slug: string; name: string; description?: string; sort_order: number; is_active: boolean; metadata?: JsonRecord };
type LegacyNewsPost = JsonRecord & { legacy_id: string; title: string; slug: string; excerpt?: string; body: string; category_slug: string; status: string; is_featured: boolean; is_pinned: boolean; published_at?: string | null; cover_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; metadata?: JsonRecord };
type LegacyAd = JsonRecord & { legacy_id: string; placement: string; title: string; href: string; image_url: string; open_mode: string; sort_order: number; is_active: boolean; starts_at?: string | null; ends_at?: string | null; metadata?: JsonRecord };
type LegacyHomeSection = JsonRecord & { legacy_id: string; key: string; title: string; description?: string; module: string; config: JsonRecord; is_visible: boolean; sort_order: number; metadata?: JsonRecord };

const LEGACY_DIR = join(process.cwd(), "data", "legacy");
const OFFICIAL_METADATA = {
  source: "legacy_official_import",
  origin: "openaa-ny",
  approved_for: "initial_production_content",
};
const MODULES: Exclude<ModuleName, "all">[] = ["navigation", "top-links", "ticker", "news", "ads", "home"];
const IMAGE_HOST = "img.openaa.com";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  enforceSafety(options);

  const modules = options.moduleName === "all" ? MODULES : [options.moduleName];
  const plans = modules.flatMap((moduleName) => planModule(moduleName));

  printHeader(options);
  for (const plan of plans) printPlan(plan);

  const totalSkip = plans.reduce((sum, plan) => sum + plan.skip, 0);
  const totalWarnings = plans.reduce((sum, plan) => sum + plan.warnings.length, 0);

  console.log("");
  console.log(`Summary: ${plans.length} plan(s), ${totalSkip} invalid item(s), ${totalWarnings} warning(s).`);

  if (!options.apply) {
    console.log("Dry-run complete. No database writes were performed.");
    return;
  }

  const supabase = createImportClient(options.env);
  console.log("");
  console.log("Apply mode enabled for local/staging legacy official content.");

  const applyStats: ApplyStats[] = [];
  for (const moduleName of modules) {
    applyStats.push(await applyModule(supabase, moduleName));
  }

  console.log("");
  console.log("Apply summary");
  for (const stats of applyStats) {
    console.log(`[${stats.moduleName}] created: ${stats.created}, updated: ${stats.updated}, skipped: ${stats.skipped}`);
    for (const warning of stats.warnings) console.log(`Warning: ${warning}`);
  }

  const tableStats = await readTableStats(supabase);
  console.log("");
  console.log("Imported table counts");
  for (const [table, count] of Object.entries(tableStats)) console.log(`${table}: ${count}`);
}

function parseArgs(args: string[]): CliOptions {
  const values = new Map<string, string | true>();
  for (const arg of args) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue] = arg.slice(2).split("=", 2);
    values.set(rawKey, rawValue ?? true);
  }

  const moduleValue = values.get("module") ?? process.env.npm_config_module;
  const envValue = values.get("env") ?? process.env.npm_config_env;
  const moduleName = isModuleName(moduleValue) ? moduleValue : undefined;
  const env = isEnvName(envValue) ? envValue : undefined;

  if (!moduleName) fail("Missing or invalid --module. Use navigation, news, ads, ticker, top-links, home, or all.");
  if (!env) fail("Missing or invalid --env. Use local, staging, or production.");

  const apply = values.has("apply") || hasNpmApplyFlag() || process.env.LEGACY_IMPORT_APPLY === "true";
  const dryRun = !apply || values.has("dry-run") || hasNpmFlag("dry_run");

  return { moduleName, env, apply, dryRun };
}

function hasNpmFlag(name: string) {
  const value = process.env[`npm_config_${name}`];
  return value !== undefined && value !== "false";
}

function hasNpmApplyFlag() {
  if (hasNpmFlag("apply")) return true;

  // npm 10 on Windows can consume a bare `--apply` as shorthand config flags
  // instead of forwarding it to the script. Detect that exact shape so the
  // documented command still works, while keeping dry-run as the default.
  return process.env.npm_config_long === "true"
    && process.env.npm_config_parseable === "true"
    && process.env.npm_config_yes === "true";
}

function enforceSafety(options: CliOptions) {
  if (options.env === "production" && options.apply) {
    fail("Production apply is intentionally disabled in Seed-B3. Use local or staging only.");
  }
}

function planModule(moduleName: Exclude<ModuleName, "all">): Plan[] {
  switch (moduleName) {
    case "navigation":
      return [planNavigation()];
    case "news":
      return [
        planArrayFile("news-categories", "news categories", ["slug", "name", "sort_order", "is_active"]),
        planArrayFile("news-posts", "news posts", ["title", "slug", "body", "category_slug", "status", "legacy_id"]),
      ];
    case "ads":
      return [planArrayFile("ads", "ads", ["placement", "title", "href", "image_url", "open_mode", "sort_order", "is_active", "legacy_id"])];
    case "ticker":
      return [planArrayFile("ticker", "ticker", ["title", "href", "module", "is_enabled", "sort_order", "legacy_id"])];
    case "top-links":
      return [planArrayFile("top-links", "top links", ["title", "href", "open_mode", "sort_order", "is_active", "legacy_id"])];
    case "home":
      return [planArrayFile("home-sections", "home sections", ["key", "title", "module", "is_visible", "sort_order", "config"])];
  }
}

function planNavigation(): Plan {
  const file = resolveFile("navigation");
  const data = readJson(file);
  const record = asRecord(data);
  const categories = Array.isArray(record.categories) ? record.categories : [];
  const links = Array.isArray(record.links) ? record.links : [];
  const warnings: string[] = [];

  const invalidCategories = countInvalid(categories, ["slug", "name", "sort_order", "is_active"], warnings, "navigation category");
  const invalidLinks = countInvalid(links, ["category_slug", "title", "url", "sort_order", "is_active", "legacy_id"], warnings, "navigation link");
  warnImageUrls(links, warnings, "navigation link");
  warnUnsafeRoutes(links, warnings, "navigation link", "url");

  return {
    moduleName: "navigation",
    file,
    create: categories.length - invalidCategories + links.length - invalidLinks,
    update: categories.length - invalidCategories + links.length - invalidLinks,
    skip: invalidCategories + invalidLinks,
    warnings,
    reviewStats: collectReviewStats(data, [...categories, ...links]),
  };
}

function planArrayFile(baseName: string, label: string, required: string[]): Plan {
  const file = resolveFile(baseName);
  const data = readJson(file);
  const warnings: string[] = [];
  const items = readItems(data, baseName, label, warnings);

  const invalid = countInvalid(items, required, warnings, label);
  warnImageUrls(items, warnings, label);
  warnUnsafeRoutes(items, warnings, label, baseName === "top-links" ? "href" : undefined);

  return {
    moduleName: baseNameToModule(baseName),
    file,
    create: items.length - invalid,
    update: items.length - invalid,
    skip: invalid,
    warnings,
    reviewStats: collectReviewStats(data, items),
  };
}

async function applyModule(supabase: SupabaseClient, moduleName: Exclude<ModuleName, "all">): Promise<ApplyStats> {
  switch (moduleName) {
    case "navigation":
      return applyNavigation(supabase);
    case "top-links":
      return applyTopLinks(supabase);
    case "ticker":
      return applyTicker(supabase);
    case "news":
      return applyNews(supabase);
    case "ads":
      return applyAds(supabase);
    case "home":
      return applyHome(supabase);
  }
}

async function applyNavigation(supabase: SupabaseClient): Promise<ApplyStats> {
  const data = readLegacyFile("navigation");
  const categories = asArray<LegacyNavigationCategory>(asRecord(data).categories);
  const links = asArray<LegacyNavigationLink>(asRecord(data).links);
  const stats = applyStats("navigation");
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    if (!category.slug || hasSecondhand(category.slug)) {
      stats.skipped += 1;
      continue;
    }

    const metadata = legacyMetadata(category.legacy_id ?? category.slug, category.metadata);
    const result = await upsertByFilter(supabase, "navigation_categories", { slug: category.slug }, {
      slug: category.slug,
      name: category.name,
      description: optionalText(category.description),
      icon: optionalText(category.icon),
      sort_order: integer(category.sort_order, 0),
      is_active: Boolean(category.is_active),
      updated_at: nowIso(),
    }, stats);

    categoryIds.set(category.slug, result.id);
    await patchMetadataIfSupported(supabase, "navigation_categories", result.id, metadata);
  }

  for (const link of links) {
    const categoryId = categoryIds.get(link.category_slug) ?? (await findIdBy(supabase, "navigation_categories", { slug: link.category_slug }));
    const url = normalizeSafeUrl(link.url);
    if (!categoryId || !url || hasSecondhand(url)) {
      stats.skipped += 1;
      continue;
    }

    const imageAssetId = link.image_url ? await ensureExternalImageAsset(supabase, link.image_url, "navigation_link", stats) : null;
    const metadata = legacyMetadata(link.legacy_id, link.metadata);
    const existing = await findByLegacyId(supabase, "navigation_links", link.legacy_id)
      ?? await findOne(supabase, "navigation_links", { category_id: categoryId, url });
    const payload = {
      category_id: categoryId,
      title: link.title,
      description: optionalText(link.description),
      url,
      icon: optionalText(link.icon),
      icon_image_asset_id: imageAssetId,
      open_mode: openModeFromUrl(url, asString(link.open_mode, "new")),
      sort_order: integer(link.sort_order, 0),
      is_active: Boolean(link.is_active),
      is_featured: Boolean(link.is_featured),
      metadata,
      updated_at: nowIso(),
    };

    await insertOrUpdate(supabase, "navigation_links", existing?.id, payload, stats);
  }

  return stats;
}

async function applyTopLinks(supabase: SupabaseClient): Promise<ApplyStats> {
  const data = readLegacyFile("top-links");
  const links = asArray<LegacyTopLink>(asRecord(data).links);
  const stats = applyStats("top-links");

  for (const link of links) {
    const href = normalizeSafeUrl(link.href);
    const openMode = normalizeOpenMode(link.open_mode);
    if (!href || !openMode || hasSecondhand(href)) {
      stats.skipped += 1;
      continue;
    }

    const key = legacyKey(link.legacy_id);
    const existing = await findIdBy(supabase, "top_quick_links", { key })
      ?? (await findOne(supabase, "top_quick_links", { href, title: link.title }))?.id;
    const payload = {
      key,
      title: link.title,
      href,
      icon: optionalText(link.icon),
      open_mode: openMode,
      sort_order: integer(link.sort_order, 0),
      is_active: Boolean(link.is_active),
      updated_at: nowIso(),
    };

    const result = await insertOrUpdate(supabase, "top_quick_links", existing, payload, stats);
    await patchMetadataIfSupported(supabase, "top_quick_links", result.id, legacyMetadata(link.legacy_id, link.metadata));
  }

  return stats;
}

async function applyTicker(supabase: SupabaseClient): Promise<ApplyStats> {
  const data = readLegacyFile("ticker");
  const sections = asArray<LegacyTickerSection>(asRecord(data).sections);
  const rootMetadata = asRecord(asRecord(data).metadata);
  const globalConfig = asRecord(asRecord(data).global);
  const stats = applyStats("ticker");

  for (const section of sections) {
    const href = normalizeSafeUrl(section.href);
    const moduleName = normalizeModule(section.module);
    if (!href || !moduleName || hasSecondhand(href)) {
      stats.skipped += 1;
      continue;
    }

    const existing = await findOne(supabase, "latest_ticker", { module: moduleName, title: section.title, href });
    const payload = {
      title: section.title,
      href,
      module: moduleName,
      is_enabled: Boolean(section.is_enabled),
      sort_order: integer(section.sort_order, 0),
      starts_at: section.starts_at ?? null,
      ends_at: section.ends_at ?? null,
      updated_at: nowIso(),
    };
    const result = await insertOrUpdate(supabase, "latest_ticker", existing?.id, payload, stats);
    await patchMetadataIfSupported(supabase, "latest_ticker", result.id, legacyMetadata(section.legacy_id, {
      ...section.metadata,
      global: globalConfig,
      root_notes: rootMetadata.notes,
      display_count: section.display_count,
    }));
  }

  return stats;
}

async function applyNews(supabase: SupabaseClient): Promise<ApplyStats> {
  const categoryData = readLegacyFile("news-categories");
  const postData = readLegacyFile("news-posts");
  const categories = asArray<LegacyNewsCategory>(asRecord(categoryData).categories);
  const posts = asArray<LegacyNewsPost>(asRecord(postData).posts);
  const stats = applyStats("news");
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    if (!category.slug || hasSecondhand(category.slug)) {
      stats.skipped += 1;
      continue;
    }

    const result = await upsertByFilter(supabase, "news_categories", { slug: category.slug }, {
      slug: category.slug,
      name: category.name,
      description: optionalText(category.description),
      sort_order: integer(category.sort_order, 0),
      is_active: Boolean(category.is_active),
      updated_at: nowIso(),
    }, stats);
    categoryIds.set(category.slug, result.id);
    await patchMetadataIfSupported(supabase, "news_categories", result.id, legacyMetadata(category.legacy_id, category.metadata));
  }

  for (const post of posts) {
    if (post.status !== "published" || hasSecondhand(post.slug)) {
      stats.skipped += 1;
      continue;
    }

    const categoryId = categoryIds.get(post.category_slug) ?? (await findIdBy(supabase, "news_categories", { slug: post.category_slug }));
    const imageAssetId = post.cover_image_url ? await ensureExternalImageAsset(supabase, post.cover_image_url, "news_post", stats) : null;
    const metadata = legacyMetadata(post.legacy_id, post.metadata);
    const existing = await findIdBy(supabase, "news_posts", { slug: post.slug });
    const payload = {
      category_id: categoryId,
      title: post.title,
      slug: post.slug,
      excerpt: optionalText(post.excerpt),
      body: post.body,
      cover_image_asset_id: imageAssetId,
      status: "published",
      is_featured: Boolean(post.is_featured),
      is_pinned: Boolean(post.is_pinned),
      published_at: post.published_at ?? null,
      seo_title: optionalText(post.seo_title),
      seo_description: optionalText(post.seo_description),
      metadata,
      updated_at: nowIso(),
    };

    await insertOrUpdate(supabase, "news_posts", existing, payload, stats);
  }

  return stats;
}

async function applyAds(supabase: SupabaseClient): Promise<ApplyStats> {
  const data = readLegacyFile("ads");
  const ads = asArray<LegacyAd>(asRecord(data).ads);
  const stats = applyStats("ads");

  for (const ad of ads) {
    const href = normalizeSafeUrl(ad.href);
    const openMode = normalizeOpenMode(ad.open_mode);
    if (!href || !openMode || hasSecondhand(href) || !isImgOpenAA(ad.image_url)) {
      stats.skipped += 1;
      continue;
    }

    const imageAssetId = await ensureExternalImageAsset(supabase, ad.image_url, "ad", stats);
    const metadata = legacyMetadata(ad.legacy_id, ad.metadata);
    const existing = await findByLegacyId(supabase, "ads", ad.legacy_id)
      ?? await findOne(supabase, "ads", { placement: ad.placement, image_asset_id: imageAssetId, title: ad.title });
    const payload = {
      placement: ad.placement,
      title: ad.title,
      href,
      image_asset_id: imageAssetId,
      open_mode: openMode,
      is_active: Boolean(ad.is_active),
      starts_at: ad.starts_at ?? null,
      ends_at: ad.ends_at ?? null,
      sort_order: integer(ad.sort_order, 0),
      metadata,
      updated_at: nowIso(),
    };

    await insertOrUpdate(supabase, "ads", existing?.id, payload, stats);
  }

  return stats;
}

async function applyHome(supabase: SupabaseClient): Promise<ApplyStats> {
  const data = readLegacyFile("home-sections");
  const sections = asArray<LegacyHomeSection>(asRecord(data).sections);
  const stats = applyStats("home");

  for (const section of sections) {
    if (!section.key || JSON.stringify(section).includes("/secondhand")) {
      stats.skipped += 1;
      continue;
    }

    const metadata = legacyMetadata(section.legacy_id, section.metadata);
    const config = { ...section.config, metadata };
    await upsertByFilter(supabase, "home_sections", { key: section.key }, {
      key: section.key,
      title: section.title,
      description: optionalText(section.description),
      module: section.module,
      config,
      is_visible: Boolean(section.is_visible),
      sort_order: integer(section.sort_order, 0),
      updated_at: nowIso(),
    }, stats);
  }

  return stats;
}

async function ensureExternalImageAsset(supabase: SupabaseClient, imageUrl: string, entityType: string, stats: ApplyStats) {
  if (!isImgOpenAA(imageUrl)) {
    stats.warnings.push(`${entityType}: skipped non-img.openaa.com image`);
    return null;
  }

  const existing = await findOne(supabase, "image_assets", { external_url: imageUrl });
  const payload = {
    source_type: "external",
    external_url: imageUrl,
    external_host: IMAGE_HOST,
    public_url: imageUrl,
    entity_type: entityType,
    is_public: true,
    status: "active",
    metadata: legacyMetadata(imageUrl, { source_type: "external" }),
    updated_at: nowIso(),
  };

  if (existing?.id) {
    await updateRow(supabase, "image_assets", existing.id, payload);
    return existing.id;
  }

  const created = await insertRow(supabase, "image_assets", payload);
  return created.id;
}

async function upsertByFilter(supabase: SupabaseClient, table: string, filter: JsonRecord, payload: JsonRecord, stats: ApplyStats) {
  const existingId = await findIdBy(supabase, table, filter);
  return insertOrUpdate(supabase, table, existingId, payload, stats);
}

async function insertOrUpdate(supabase: SupabaseClient, table: string, id: string | null | undefined, payload: JsonRecord, stats: ApplyStats) {
  if (id) {
    const row = await updateRow(supabase, table, id, payload);
    stats.updated += 1;
    return row;
  }

  const row = await insertRow(supabase, table, payload);
  stats.created += 1;
  return row;
}

async function insertRow(supabase: SupabaseClient, table: string, payload: JsonRecord) {
  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error) fail(`${table}: insert failed: ${safeError(error.message)}`);
  return data as { id: string };
}

async function updateRow(supabase: SupabaseClient, table: string, id: string, payload: JsonRecord) {
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select("id").single();
  if (error) fail(`${table}: update failed: ${safeError(error.message)}`);
  return data as { id: string };
}

async function findIdBy(supabase: SupabaseClient, table: string, filter: JsonRecord) {
  return (await findOne(supabase, table, filter))?.id ?? null;
}

async function findOne(supabase: SupabaseClient, table: string, filter: JsonRecord) {
  let query = supabase.from(table).select("id").limit(1);
  for (const [key, value] of Object.entries(filter)) {
    if (value === null) query = query.is(key, null);
    else query = query.eq(key, value);
  }

  const { data, error } = await query.maybeSingle();
  if (error) fail(`${table}: lookup failed: ${safeError(error.message)}`);
  return (data as { id: string } | null) ?? null;
}

async function findByLegacyId(supabase: SupabaseClient, table: string, legacyId: string) {
  const { data, error } = await supabase.from(table).select("id").eq("metadata->>legacy_id", legacyId).limit(1).maybeSingle();
  if (error) {
    if (error.message.includes("metadata")) return null;
    fail(`${table}: legacy lookup failed: ${safeError(error.message)}`);
  }
  return (data as { id: string } | null) ?? null;
}

async function patchMetadataIfSupported(supabase: SupabaseClient, table: string, id: string, metadata: JsonRecord) {
  const { error } = await supabase.from(table).update({ metadata }).eq("id", id);
  if (error && !/metadata|column/i.test(error.message)) {
    fail(`${table}: metadata patch failed: ${safeError(error.message)}`);
  }
}

async function readTableStats(supabase: SupabaseClient) {
  const tables = [
    "navigation_categories",
    "navigation_links",
    "top_quick_links",
    "latest_ticker",
    "news_categories",
    "news_posts",
    "ads",
    "home_sections",
  ];
  const stats: Record<string, number> = {};

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
    if (error) fail(`${table}: count failed: ${safeError(error.message)}`);
    stats[table] = count ?? 0;
  }

  const { count: externalImageCount, error: externalImageError } = await supabase
    .from("image_assets")
    .select("id", { count: "exact", head: true })
    .eq("source_type", "external")
    .eq("external_host", IMAGE_HOST);

  if (externalImageError) fail(`image_assets external count failed: ${safeError(externalImageError.message)}`);
  stats.image_assets_external = externalImageCount ?? 0;

  return stats;
}

function createImportClient(env: EnvName) {
  const credentials = env === "local" ? readLocalSupabaseCredentials() : readStagingSupabaseCredentials();
  return createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readLocalSupabaseCredentials() {
  const envUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
  const envKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
  if (envUrl && envKey) {
    assertLocalSupabaseUrl(envUrl);
    return { url: envUrl, serviceRoleKey: envKey };
  }

  try {
    const raw = execSync("supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as { API_URL?: string; SERVICE_ROLE_KEY?: string; SECRET_KEY?: string };
    const url = parsed.API_URL;
    const key = parsed.SERVICE_ROLE_KEY ?? parsed.SECRET_KEY;
    if (url && key) {
      assertLocalSupabaseUrl(url);
      return { url, serviceRoleKey: key };
    }
  } catch {
    // Fall through to friendly error.
  }

  fail("Local apply requires local Supabase to be running or LEGACY_IMPORT_SUPABASE_URL and LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY to be set.");
}

function assertLocalSupabaseUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail("Local apply requires a valid local Supabase URL.");
  }

  if (!["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) {
    fail("Local apply refuses non-local Supabase URLs. Use --env=staging with explicit staging credentials for remote projects.");
  }
}

function readStagingSupabaseCredentials() {
  const url = process.env.LEGACY_IMPORT_SUPABASE_URL ?? process.env.STAGING_SUPABASE_URL;
  const key = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY ?? process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail("Staging apply requires LEGACY_IMPORT_SUPABASE_URL and LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY or staging-specific equivalents.");
  }
  return { url, serviceRoleKey: key };
}

function readItems(data: unknown, baseName: string, label: string, warnings: string[]) {
  if (Array.isArray(data)) return data;

  const record = asRecord(data);
  const wrapperKeyByFile: Record<string, string> = {
    ads: "ads",
    "home-sections": "sections",
    "news-categories": "categories",
    "news-posts": "posts",
    ticker: "sections",
    "top-links": "links",
  };
  const wrapperKey = wrapperKeyByFile[baseName];
  const wrappedItems = wrapperKey ? record[wrapperKey] : undefined;

  if (Array.isArray(wrappedItems)) return wrappedItems;

  warnings.push(`${label}: expected a JSON array or supported metadata wrapper.`);
  return [];
}

function collectReviewStats(data: unknown, items: unknown[]) {
  const rootMetadata = asRecord(asRecord(data).metadata);
  const stats: Record<string, number> = {};
  const noteStats: Record<string, number> = {};

  for (const key of [
    "skipped_old_storage_image_count",
    "needs_human_review_count",
    "cover_needs_replacement_count",
    "body_needs_review_count",
    "needs_domain_review_count",
    "needs_freshness_review_count",
  ]) {
    const value = rootMetadata[key];
    if (typeof value === "number" && value > 0) stats[key] = value;
  }

  for (const item of items) {
    const metadata = asRecord(asRecord(item).metadata);
    const notes = Array.isArray(metadata.notes) ? metadata.notes : [];
    for (const note of notes) {
      if (typeof note !== "string") continue;
      if (
        note === "needs_human_review" ||
        note === "cover_needs_replacement" ||
        note === "body_needs_review" ||
        note === "needs_domain_review" ||
        note === "needs_freshness_review" ||
        note === "skipped_old_storage_image"
      ) {
        const key = note === "skipped_old_storage_image" ? "skipped_old_storage_image_count" : `${note}_count`;
        noteStats[key] = (noteStats[key] ?? 0) + 1;
      }
    }
  }

  for (const [key, value] of Object.entries(noteStats)) {
    stats[key] = Math.max(stats[key] ?? 0, value);
  }

  return Object.keys(stats).length > 0 ? stats : undefined;
}

function resolveFile(baseName: string) {
  const real = join(LEGACY_DIR, `${baseName}.json`);
  const example = join(LEGACY_DIR, `${baseName}.example.json`);
  if (existsSync(real)) return real;
  if (existsSync(example)) return example;
  fail(`Missing data file for ${baseName}. Expected ${real} or ${example}.`);
}

function readLegacyFile(baseName: string) {
  return asRecord(readJson(resolveFile(baseName))) as LegacyFile;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`Failed to read JSON ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function countInvalid(items: unknown[], required: string[], warnings: string[], label: string) {
  let invalid = 0;
  items.forEach((item, index) => {
    const record = asRecord(item);
    const missing = required.filter((key) => record[key] === undefined || record[key] === null || record[key] === "");
    if (missing.length > 0) {
      invalid += 1;
      warnings.push(`${label} #${index + 1}: missing ${missing.join(", ")}`);
    }
  });
  return invalid;
}

function warnImageUrls(items: unknown[], warnings: string[], label: string) {
  items.forEach((item, index) => {
    const record = asRecord(item);
    const imageUrl = record.image_url ?? record.cover_image_url;
    if (typeof imageUrl === "string" && imageUrl && !imageUrl.startsWith("https://")) {
      warnings.push(`${label} #${index + 1}: image URL should be https external URL.`);
    }
    if (typeof imageUrl === "string" && imageUrl && imageUrl.includes("supabase.co/storage")) {
      warnings.push(`${label} #${index + 1}: old Supabase Storage image is not allowed as official image.`);
    }
  });
}

function warnUnsafeRoutes(items: unknown[], warnings: string[], label: string, key = "href") {
  items.forEach((item, index) => {
    const value = asRecord(item)[key];
    if (typeof value !== "string") return;
    if (hasSecondhand(value)) warnings.push(`${label} #${index + 1}: /secondhand is not allowed.`);
    if (/^javascript:/i.test(value) || /^data:/i.test(value) || /^http:\/\//i.test(value)) {
      warnings.push(`${label} #${index + 1}: unsafe URL protocol.`);
    }
  });
}

function applyStats(moduleName: ModuleName): ApplyStats {
  return { moduleName, created: 0, updated: 0, skipped: 0, warnings: [] };
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function integer(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nowIso() {
  return new Date().toISOString();
}

function legacyMetadata(legacyId: string, extra?: unknown): JsonRecord {
  return {
    ...OFFICIAL_METADATA,
    ...asRecord(extra),
    legacy_id: legacyId,
  };
}

function normalizeSafeUrl(value: unknown) {
  const url = asString(value);
  if (!url || hasSecondhand(url)) return null;
  if (/^javascript:/i.test(url) || /^data:/i.test(url) || /^http:\/\//i.test(url)) return null;
  if (url.startsWith("/") || url.startsWith("https://")) return url;
  return null;
}

function normalizeOpenMode(value: unknown) {
  return value === "same" || value === "new" ? value : null;
}

function openModeFromUrl(url: string, fallback: unknown) {
  return normalizeOpenMode(fallback) ?? (url.startsWith("/") ? "same" : "new");
}

function normalizeModule(value: unknown) {
  const moduleName = asString(value);
  if (moduleName === "secondhand") return "marketplace";
  if (["news", "jobs", "housing", "marketplace", "services"].includes(moduleName)) return moduleName;
  return null;
}

function legacyKey(legacyId: string) {
  return `legacy-${legacyId}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isImgOpenAA(url: unknown) {
  return typeof url === "string" && url.startsWith(`https://${IMAGE_HOST}/`);
}

function hasSecondhand(value: unknown) {
  return typeof value === "string" && value.includes("/secondhand");
}

function safeError(message: string) {
  return message.replace(/(service[_-]?role|secret|key|token|password)[^\\s]*/gi, "$1=<redacted>");
}

function printHeader(options: CliOptions) {
  console.log("Legacy content import plan");
  console.log(`Environment: ${options.env}`);
  console.log(`Module: ${options.moduleName}`);
  console.log(`Mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(`Metadata marker: ${JSON.stringify(OFFICIAL_METADATA)}`);
  console.log("Old Supabase connections are not used by this script.");
}

function printPlan(plan: Plan) {
  console.log("");
  console.log(`[${plan.moduleName}]`);
  console.log(`File: ${plan.file}`);
  console.log(`Would create/upsert: ${plan.create}`);
  console.log(`Would update/upsert: ${plan.update}`);
  console.log(`Would skip invalid: ${plan.skip}`);
  if (plan.reviewStats) {
    for (const [key, value] of Object.entries(plan.reviewStats)) {
      console.log(`${key}: ${value}`);
    }
  }
  for (const warning of plan.warnings) console.log(`Warning: ${warning}`);
}

function isModuleName(value: unknown): value is ModuleName {
  return typeof value === "string" && ["navigation", "news", "ads", "ticker", "top-links", "home", "all"].includes(value);
}

function isEnvName(value: unknown): value is EnvName {
  return value === "local" || value === "staging" || value === "production";
}

function baseNameToModule(baseName: string): ModuleName {
  if (baseName === "news-categories" || baseName === "news-posts") return "news";
  if (baseName === "home-sections") return "home";
  if (baseName === "top-links") return "top-links";
  if (baseName === "ads" || baseName === "ticker") return baseName;
  return "all";
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? safeError(error.message) : "Unexpected import failure.");
  process.exit(1);
});
