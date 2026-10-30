import { publicPostsResponse, readPostType, searchPostsResponse } from "@/app/api/_utils/posts";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = readPostType(request);

  // Explicit paged-list requests keep q within the normal filter and pagination contract.
  if (url.searchParams.get("q") && url.searchParams.get("view") !== "list") {
    return searchPostsResponse(request);
  }

  if (!type) {
    return Response.json({ state: "error", data: [], error: "invalid_type" }, { status: 400 });
  }

  return publicPostsResponse(type, request);
}
