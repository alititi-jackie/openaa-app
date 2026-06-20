import "server-only";

import { createClient } from "@supabase/supabase-js";

import { isSupabaseServerConfigured } from "./server";

const PUBLIC_FETCH_TIMEOUT_MS = 1500;

export function createSupabasePublicClient() {
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
      fetch: fetchWithTimeout,
    },
  });
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PUBLIC_FETCH_TIMEOUT_MS);
  init?.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: init?.cache ?? "force-cache",
      next: {
        revalidate: 300,
        ...(init?.next ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
