import { NextResponse } from "next/server";
import { getHomeConfig } from "@/features/home/queries";

const allowedOrigins = new Set(["https://go.openaa.com", "https://tools.openaa.com"]);

export const revalidate = 300;

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });

  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const homeConfig = await getHomeConfig();

  return NextResponse.json(
    {
      tickerItems: homeConfig.tickerItems,
      tickerSettings: homeConfig.tickerSettings,
      topQuickLinks: homeConfig.topQuickLinks,
    },
    { headers: corsHeaders(request) },
  );
}
