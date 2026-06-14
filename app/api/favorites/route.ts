import { NextResponse } from "next/server";
import { getMyFavorites } from "@/features/favorites/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    return NextResponse.json({ state: "unauthenticated", data: [], error: "auth_required" }, { status: 401 });
  }

  const url = new URL(request.url);
  const result = await getMyFavorites({
    type: url.searchParams.get("type"),
    page: url.searchParams.get("page"),
  });

  if (result.state === "missing_config") {
    return NextResponse.json({ state: result.state, data: result.data, error: "missing_config" }, { status: 503 });
  }

  if (result.state === "error") {
    return NextResponse.json({ state: result.state, data: result.data, error: result.error ?? "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ state: result.state, data: result.data, pagination: result.pagination });
}
