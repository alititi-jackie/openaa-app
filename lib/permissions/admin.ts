import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRoleRecord } from "@/lib/supabase/types";

export type AdminCheckResult =
  | { status: "missing_config"; user: null; adminRole: null }
  | { status: "unauthenticated"; user: null; adminRole: null }
  | { status: "forbidden"; user: User; adminRole: null }
  | { status: "authorized"; user: User; adminRole: AdminRoleRecord };

export async function getCurrentAdminRole(): Promise<AdminRoleRecord | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_roles")
    .select("id,user_id,role,is_active,note,granted_at,last_admin_login_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.status !== "active") {
    return null;
  }

  return data as AdminRoleRecord;
}

export async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "missing_config", user: null, adminRole: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated", user: null, adminRole: null };
  }

  const adminRole = await getCurrentAdminRole();

  if (!adminRole) {
    return { status: "forbidden", user, adminRole: null };
  }

  return { status: "authorized", user, adminRole };
}

export async function hasAdminPermission(permissionKey: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.rpc("has_admin_permission", {
    p_permission_key: permissionKey,
  });

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function isSuperAdmin() {
  const role = await getCurrentAdminRole();
  return role?.role === "super_admin";
}
