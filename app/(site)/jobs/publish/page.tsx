import { PostPublishPage } from "@/components/posts/PostPublishPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布招聘或求职",
  description: "发布纽约华人招聘或求职信息。",
  path: "/jobs/publish",
  noIndex: true,
});

export default async function JobsPublishPage() {
  return <PostPublishPage postType="job" returnTo="/jobs/publish" />;
}
