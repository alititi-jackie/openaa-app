import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RateLimitClient = SupabaseClient;

type CheckRateLimitInput = {
  supabase: RateLimitClient;
  actorId: string;
  action: string;
  limit: number;
  windowMs: number;
  metadata?: Record<string, unknown>;
};

export async function checkRateLimit({
  supabase,
  actorId,
  action,
  limit,
  windowMs,
  metadata = {},
}: CheckRateLimitInput) {
  if (!actorId || limit < 1 || windowMs < 1000) {
    throw new Error("Invalid rate-limit configuration");
  }

  const now = new Date();
  const windowStart = rateLimitWindowStart(now, windowMs);
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_actor_id: actorId,
    p_action: action,
    p_limit: limit,
    p_window_start: windowStart.toISOString(),
    p_metadata: metadata,
  });
  if (error) throw error;
  return { allowed: data === true, count: data === true ? 1 : limit };
}

export async function checkAdminRateLimit(input: Omit<CheckRateLimitInput, "supabase">) {
  const supabase = createSupabaseAdminClient();
  return checkRateLimit({ ...input, supabase });
}

export function readClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimitWindowStart(base: Date, windowMs: number) {
  return new Date(Math.floor(base.getTime() / windowMs) * windowMs);
}
