import { PostPublishPage } from "@/components/posts/PostPublishPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布房屋",
  description: "发布纽约租房、求租、合租或房屋信息。",
  path: "/housing/publish",
  noIndex: true,
});

export default async function HousingPublishPage() {
  return <PostPublishPage postType="housing" returnTo="/housing/publish" />;
}
