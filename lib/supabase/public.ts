import "server-only";

import { createClient } from "@supabase/supabase-js";

import { isSupabaseServerConfigured } from "./server";

const PUBLIC_FETCH_TIMEOUT_MS = 1500;

type SupabasePublicClientOptions = {
  cache?: RequestCache;
  revalidate?: number;
  timeoutMs?: number;
};

export function createSupabasePublicClient(options: SupabasePublicClientOptions = {}) {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  if (!isSupabaseServerConfigured()) {
    return null;
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetchWithTimeout(input, init, options),
    },
  });
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, options: SupabasePublicClientOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? PUBLIC_FETCH_TIMEOUT_MS);
  init?.signal?.addEventListener("abort", () => controller.abort(), { once: true });
  const cache = init?.cache ?? options.cache ?? "force-cache";
  const next = cache === "no-store"
    ? undefined
    : {
        revalidate: options.revalidate ?? 300,
        ...(init?.next ?? {}),
      };

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache,
      ...(next ? { next } : {}),
    });
  } finally {
    clearTimeout(timeout);
  }
}
