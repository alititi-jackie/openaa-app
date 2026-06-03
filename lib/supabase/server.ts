import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export function isSupabaseServerConfigured() {
  return isValidSupabasePublicConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isValidSupabasePublicConfig(supabaseUrl, supabaseAnonKey)) {
    return null;
  }
  const validSupabaseUrl = supabaseUrl;
  const validSupabaseAnonKey = supabaseAnonKey ?? "";

  const cookieStore = await cookies();

  try {
    return createServerClient(validSupabaseUrl, validSupabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies. Route handlers and
            // server actions still can, and Supabase refreshes there when needed.
          }
        },
      },
    });
  } catch {
    return null;
  }
}

function isValidSupabasePublicConfig(url: string | undefined, anonKey: string | undefined): url is string {
  if (!url || !anonKey) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
