import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminAuditLogInput = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ipHash?: string | null;
  userAgent?: string | null;
};

export async function writeAdminAuditLog(input: AdminAuditLogInput) {
  try {
    const metadata = {
      ...(input.ipHash ? { ip_hash: input.ipHash } : {}),
      ...(input.userAgent ? { user_agent: input.userAgent } : {}),
    };
    const { error } = await createSupabaseAdminClient()
      .from("admin_audit_logs")
      .insert({
        actor_id: input.actorId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        before_data: input.beforeData ?? null,
        after_data: input.afterData ?? null,
        ip_hash: input.ipHash ?? null,
        user_agent: input.userAgent ?? null,
        metadata,
      });

    return !error;
  } catch {
    return false;
  }
}
