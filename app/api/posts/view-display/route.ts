import { NextResponse } from "next/server";
import { readPostViewSettings } from "@/features/posts/viewQueries";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readPostViewSettings();
  return NextResponse.json({ settings: config.ok ? config.settings : null }, {
    status: config.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
