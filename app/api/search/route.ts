import { searchPostsResponse } from "@/app/api/_utils/posts";

export async function GET(request: Request) {
  return searchPostsResponse(request);
}
