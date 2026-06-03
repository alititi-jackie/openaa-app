import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSupabaseSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
    return NextResponse.next({ request });
  }
  const validSupabaseUrl = supabaseUrl;
  const validSupabaseAnonKey = supabaseAnonKey ?? "";

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(validSupabaseUrl, validSupabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}

function isValidSupabaseConfig(url: string | undefined, anonKey: string | undefined): url is string {
  if (!url || !anonKey) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
