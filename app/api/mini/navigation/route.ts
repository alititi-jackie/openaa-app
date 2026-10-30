import { NextResponse } from "next/server";
import { getNavigationPageData } from "@/features/navigation/queries";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const result = await getNavigationPageData();
  if (result.state !== "ready") {
    return NextResponse.json({ state: "error", error: "navigation_unavailable" }, { status: result.state === "missing_config" ? 503 : 500, headers });
  }
  const visible = new Set(result.categories.map(category => category.slug));
  return NextResponse.json({ state: "ready", data: {
    categories: result.categories.map(c => ({ slug: c.slug, name: c.name })),
    links: result.links.filter(link => link.isActive && !link.deletedAt && link.categorySlug && visible.has(link.categorySlug))
      .map(link => ({ id: link.id, categorySlug: link.categorySlug, title: link.title,
        description: link.description, url: link.url, icon: link.icon })),
  } }, { headers });
}
