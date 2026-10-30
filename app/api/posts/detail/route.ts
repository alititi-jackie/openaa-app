import { NextResponse } from "next/server";
import { getPublicPostById } from "@/features/posts/queries";
import type { PostType } from "@/features/posts/types";

const types = new Set<PostType>(["job", "housing", "marketplace", "service"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const value = params.get("type") ?? "";
  if (!uuidPattern.test(id) || !types.has(value as PostType)) {
    return NextResponse.json({ state: "error", error: "invalid_request" }, { status: 400 });
  }

  const result = await getPublicPostById(id, value as PostType);
  const headers = { "Cache-Control": "no-store" };
  if (result.state === "missing_config") {
    return NextResponse.json({ state: "error", error: "missing_config" }, { status: 503, headers });
  }
  if (result.state === "error") {
    return NextResponse.json({ state: "error", error: "detail_unavailable" }, { status: 500, headers });
  }
  if (!result.data) {
    return NextResponse.json({ state: "ready", data: null }, { status: 404, headers });
  }

  const post = result.data;
  // Explicit public DTO: do not serialize sourceRecord, contact or private metadata.
  const data = {
    id: post.id,
    type: post.type,
    title: post.title,
    description: post.description,
    body: post.body,
    meta: post.meta,
    location: post.location,
    area: post.area,
    priceDisplay: post.priceDisplay,
    tag: post.tag,
    secondaryTag: post.secondaryTag,
    authorName: post.authorName,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    imageUrl: post.imageUrl,
    images: post.images.map(image => ({ url: image.url, caption: image.caption })),
    detailMetaFields: post.detailMetaFields.map(field => ({ label: field.label, value: field.value })),
  };
  return NextResponse.json({ state: "ready", data }, { headers });
}
