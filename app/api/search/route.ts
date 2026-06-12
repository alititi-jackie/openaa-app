import { NextResponse } from "next/server";
import { searchAllPublicContent } from "@/features/search/queries";

function readLimit(request: Request, fallback = 8) {
  const url = new URL(request.url);
  const parsed = Number(url.searchParams.get("limit") ?? fallback);
  return Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.floor(parsed))) : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await searchAllPublicContent({
    q: url.searchParams.get("q") ?? "",
    limit: readLimit(request),
  });

  if (result.state === "missing_config") {
    return NextResponse.json(result, { status: 503 });
  }

  if (result.state === "error") {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
