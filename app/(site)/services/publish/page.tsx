import { PostPublishPage } from "@/components/posts/PostPublishPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布本地服务",
  description: "发布纽约本地服务信息。",
  path: "/services/publish",
  noIndex: true,
});

export default async function ServicesPublishPage() {
  return <PostPublishPage postType="service" returnTo="/services/publish" />;
}
