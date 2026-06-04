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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|openaa-logo.png|og-default.png).*)"],
};

function redirectToPrimaryDomain(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const shouldRedirectHost = host === "www.openaa.app";
  const shouldRedirectProtocol = host === "openaa.app" && forwardedProtocol === "http";

  if (!shouldRedirectHost && !shouldRedirectProtocol) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = "openaa.app";
  url.port = "";

  return NextResponse.redirect(url, 301);
}
