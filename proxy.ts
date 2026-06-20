import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const primaryHostname = "openaa.com";
const redirectHostnames = new Set(["www.openaa.com", "app.openaa.com", "openaa.cn", "www.openaa.cn", "openaa.app", "www.openaa.app"]);

export async function proxy(request: NextRequest) {
  const redirectResponse = redirectToPrimaryDomain(request);

  if (redirectResponse) {
    return redirectResponse;
  }

  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|icons/|og-default.png|openaa-logo.png).*)",
  ],
};

function redirectToPrimaryDomain(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];
  const shouldRedirectHost = host ? redirectHostnames.has(host) : false;

  if (!shouldRedirectHost) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = primaryHostname;
  url.port = "";

  return NextResponse.redirect(url, 301);
}
