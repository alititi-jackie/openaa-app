import { NextResponse } from "next/server";
import { getMyFavoritePosts } from "@/features/posts/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { postsJson } from "@/app/api/_utils/posts";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    return NextResponse.json({ state: "unauthenticated", data: [], error: "auth_required" }, { status: 401 });
  }

  return postsJson(await getMyFavoritePosts());
}
