import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

type Finding = {
  level: "error" | "warning";
  message: string;
};

const findings: Finding[] = [];
const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function walk(dir: string): string[] {
  const base = join(root, dir);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true }).flatMap((entry) => {
    const path = join(base, entry.name);
    const normalized = relative(root, path).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(normalized) : [normalized];
  });
}

function add(level: Finding["level"], message: string) {
  findings.push({ level, message });
}

function auditAdminPages() {
  const pages = walk("app/admin").filter((file) => file.endsWith("/page.tsx") || file === "app/admin/page.tsx");
  for (const page of pages) {
    const content = read(page);
    if (!content.includes("AdminAuthGate")) add("error", `${page} does not use AdminAuthGate.`);
    if (!content.includes("noIndex: true")) add("error", `${page} is missing noIndex metadata.`);
    if (!content.includes("buildPageMetadata")) add("warning", `${page} does not use buildPageMetadata.`);
  }
}

function auditDashboardCoverage() {
  const dashboard = read("app/admin/dashboard/page.tsx");
  const adminModules = read("features/admin/adminModules.ts");
  const ignoredRoutes = new Set(["/admin/[...notFound]", "/admin/top-links", "/admin/home-config"]);
  const adminDirs = readdirSync(join(root, "app/admin"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/admin/${entry.name}`)
    .filter((route) => route !== "/admin/dashboard")
    .filter((route) => !ignoredRoutes.has(route))
    .sort();
  const dashboardHrefs = new Set(
    Array.from(`${dashboard}\n${adminModules}`.matchAll(/href:\s*"([^"]+)"/g))
      .map((match) => match[1].split("?")[0])
      .filter((href) => href.startsWith("/admin/")),
  );

  for (const route of adminDirs) {
    if (!dashboardHrefs.has(route)) add("error", `${route} is not linked from /admin/dashboard.`);
  }
  for (const href of dashboardHrefs) {
    if (!adminDirs.includes(href)) add("warning", `/admin/dashboard links to ${href}, but no matching route directory was found.`);
  }
}

function auditSensitivePatterns() {
  const files = walk(".").filter((file) => {
    if (file.startsWith(".git/") || file.startsWith(".next/") || file.startsWith("node_modules/")) return false;
    if (file === "scripts/audit-admin-backend.ts") return false;
    return /\.(ts|tsx|js|jsx|sql)$/.test(file);
  });

  for (const file of files) {
    const content = read(file);
    if (content.includes("ADMIN_TOKEN")) add("error", `${file} references ADMIN_TOKEN.`);
    if (content.includes("createSupabaseAdminClient") && !isAllowedServiceRoleFile(file)) {
      add("warning", `${file} uses createSupabaseAdminClient outside the approved server-side admin files.`);
    }
    if (file.startsWith("components/") && /SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
      add("error", `${file} references service role material in a component.`);
    }
  }
}

function auditAdminActions() {
  const actionFiles = walk("features").filter((file) => /adminActions\.ts$|actions\.ts$/.test(file));
  for (const file of actionFiles) {
    const content = read(file);
    const isAdminWriteFile =
      file.endsWith("adminActions.ts") ||
      content.includes("has_admin_permission") ||
      content.includes("hasAdminPermission") ||
      content.includes("hasAdminModulePermission");
    const hasWrite = /\.(insert|update|upsert|delete)\(/.test(content);
    const hasAuditLog = content.includes("admin_audit_logs") || content.includes("writeAdminAuditLog") || content.includes("auditLog(");
    if (isAdminWriteFile && hasWrite && !hasAuditLog) {
      add("warning", `${file} has admin-like writes but no admin_audit_logs insert.`);
    }
  }
}

function isAllowedServiceRoleFile(file: string) {
  return new Set([
    "lib/supabase/admin.ts",
    "lib/permissions/adminAuditLog.ts",
    "app/api/reports/route.ts",
    "app/api/support/tickets/route.ts",
    "features/messages/adminActions.ts",
    "features/messages/adminQueries.ts",
    "features/messages/pendingCounts.ts",
    "features/messages/recycleActions.ts",
    "features/messages/recycleQueries.ts",
    "features/navigation/queries.ts",
    "features/notifications/actions.ts",
    "features/notifications/service.ts",
    "features/posts/adminActions.ts",
    "features/posts/adminQueries.ts",
  ]).has(file);
}

auditAdminPages();
auditDashboardCoverage();
auditSensitivePatterns();
auditAdminActions();

const errors = findings.filter((finding) => finding.level === "error");
const warnings = findings.filter((finding) => finding.level === "warning");

console.log("Admin backend audit");
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

for (const finding of findings) {
  console.log(`[${finding.level}] ${finding.message}`);
}

if (errors.length > 0) {
  process.exitCode = 1;
}
