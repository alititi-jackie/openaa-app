import { PostPublishPage } from "@/components/posts/PostPublishPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布二手",
  description: "发布纽约二手出售或求购信息。",
  path: "/secondhand/publish",
  noIndex: true,
});

export default async function SecondhandPublishPage() {
  return <PostPublishPage postType="marketplace" returnTo="/secondhand/publish" />;
}
