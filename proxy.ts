import { NextResponse, type NextRequest } from "next/server";

const primaryHostname = "openaa.com";
const redirectHostnames = new Set(["www.openaa.com", "app.openaa.com", "openaa.cn", "www.openaa.cn", "openaa.app", "www.openaa.app"]);
const independentHostnames = new Set(["tools.openaa.com", "img.openaa.com", "go.openaa.com"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";

  if (host === primaryHostname || independentHostnames.has(host) || !redirectHostnames.has(host)) {
    return NextResponse.next({ request });
  }

  return redirectToPrimaryDomain(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|icons/|og-default.png|openaa-logo.png).*)",
  ],
};

function redirectToPrimaryDomain(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = primaryHostname;
  url.port = "";

  return NextResponse.redirect(url, 301);
}
