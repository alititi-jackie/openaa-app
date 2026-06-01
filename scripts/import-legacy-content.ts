import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type EnvName = "local" | "staging" | "production";
type ModuleName = "navigation" | "news" | "ads" | "ticker" | "top-links" | "home" | "all";

type CliOptions = {
  moduleName: ModuleName;
  env: EnvName;
  dryRun: boolean;
  apply: boolean;
  confirmProduction: boolean;
};

type Plan = {
  moduleName: ModuleName;
  file: string;
  create: number;
  update: number;
  skip: number;
  warnings: string[];
};

type JsonRecord = Record<string, unknown>;

const LEGACY_DIR = join(process.cwd(), "data", "legacy");
const OFFICIAL_METADATA = {
  source: "legacy_official_import",
  origin: "openaa-ny",
  approved_for: "initial_production_content",
};

const MODULES: Exclude<ModuleName, "all">[] = ["navigation", "news", "ads", "ticker", "top-links", "home"];

function main() {
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

  if (options.apply) {
    console.error("Apply mode is intentionally not implemented in Seed-A. Add database writes in Seed-B after review.");
    process.exit(1);
  }

  console.log("Dry-run complete. No database writes were performed.");
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

  const apply = values.has("apply") || process.env.npm_config_apply === "true";
  const dryRun = !apply || values.has("dry-run") || process.env.npm_config_dry_run === "true";

  return {
    moduleName,
    env,
    apply,
    dryRun,
    confirmProduction: values.has("confirm-production") || process.env.npm_config_confirm_production === "true",
  };
}

function enforceSafety(options: CliOptions) {
  if (options.env === "production" && !options.confirmProduction) {
    fail("Production imports require --confirm-production, even for dry-run.");
  }
}

function planModule(moduleName: Exclude<ModuleName, "all">): Plan[] {
  switch (moduleName) {
    case "navigation":
      return [planNavigation()];
    case "news":
      return [planArrayFile("news-categories", "news categories", ["slug", "name", "sort_order", "is_active"]), planArrayFile("news-posts", "news posts", ["title", "slug", "body", "category_slug", "status", "legacy_id"])];
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

  return {
    moduleName: "navigation",
    file,
    create: categories.length - invalidCategories + links.length - invalidLinks,
    update: categories.length - invalidCategories + links.length - invalidLinks,
    skip: invalidCategories + invalidLinks,
    warnings,
  };
}

function planArrayFile(baseName: string, label: string, required: string[]): Plan {
  const file = resolveFile(baseName);
  const data = readJson(file);
  const warnings: string[] = [];
  const items = readItems(data, baseName, label, warnings);

  const invalid = countInvalid(items, required, warnings, label);
  warnImageUrls(items, warnings, label);

  return {
    moduleName: baseNameToModule(baseName),
    file,
    create: items.length - invalid,
    update: items.length - invalid,
    skip: invalid,
    warnings,
  };
}

function readItems(data: unknown, baseName: string, label: string, warnings: string[]) {
  if (Array.isArray(data)) return data;

  const record = asRecord(data);
  const wrappedItems =
    baseName === "ticker"
      ? record.sections
      : baseName === "top-links"
        ? record.links
        : undefined;

  if (Array.isArray(wrappedItems)) return wrappedItems;

  warnings.push(`${label}: expected a JSON array or supported metadata wrapper.`);
  return [];
}

function resolveFile(baseName: string) {
  const real = join(LEGACY_DIR, `${baseName}.json`);
  const example = join(LEGACY_DIR, `${baseName}.example.json`);
  if (existsSync(real)) return real;
  if (existsSync(example)) return example;
  fail(`Missing data file for ${baseName}. Expected ${real} or ${example}.`);
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
  });
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
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

main();
