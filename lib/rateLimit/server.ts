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
    return { allowed: true, count: 0 };
  }

  const now = new Date();
  const windowStart = rateLimitWindowStart(now, windowMs);
  const { data } = await supabase
    .from("rate_limits")
    .select("id,count")
    .eq("actor_id", actorId)
    .eq("action", action)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();

  const currentCount = typeof data?.count === "number" ? data.count : 0;
  if (currentCount >= limit) {
    return { allowed: false, count: currentCount };
  }

  const nextCount = currentCount + 1;
  if (data?.id) {
    await supabase.from("rate_limits").update({ count: nextCount, updated_at: now.toISOString() }).eq("id", data.id);
  } else {
    await supabase.from("rate_limits").insert({
      actor_id: actorId,
      action,
      window_start: windowStart.toISOString(),
      count: nextCount,
      metadata,
    });
  }

  return { allowed: true, count: nextCount };
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
