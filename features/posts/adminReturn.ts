import "server-only";

import { hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";

type SearchParams = Record<string, string | string[] | undefined> | undefined;

export async function getAdminPostReturnHref(searchParams: SearchParams) {
  const raw = firstParam(searchParams?.adminReturn);
  if (raw !== "/admin/user-posts") return null;

  const [superAdmin, viewPosts, moderatePosts] = await Promise.all([
    isSuperAdmin(),
    hasAdminPermission("view_posts"),
    hasAdminPermission("moderate_posts"),
  ]);

  return superAdmin || viewPosts || moderatePosts ? raw : null;
}

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}
