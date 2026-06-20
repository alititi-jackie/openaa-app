import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const redirectResponse = redirectToPrimaryDomain(request);

  if (redirectResponse) {
    return redirectResponse;
  }

  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/account/:path*",
    "/navigation/my/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/:path*",
    "/:path*/publish",
    "/:path*/edit/:path*",
    "/api/admin/:path*",
    "/api/auth/:path*",
    "/api/favorites/:path*",
    "/api/support/:path*",
    "/api/reports/:path*",
  ],
};

function redirectToPrimaryDomain(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();
  const shouldRedirectHost = host === "www.openaa.app";

  if (!shouldRedirectHost) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = "openaa.app";
  url.port = "";

  return NextResponse.redirect(url, 301);
}
