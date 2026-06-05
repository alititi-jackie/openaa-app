import { publicPostsResponse } from "@/app/api/_utils/posts";

export async function GET(request: Request) {
  return publicPostsResponse("marketplace", request);
}
