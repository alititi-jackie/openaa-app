import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约新闻",
  description: "纽约华人新闻、本地资讯和生活动态。",
  path: "/news",
});

export default function NewsPage() {
  return <PlaceholderPage title="新闻" description="新闻频道占位，后续接入新闻分类、列表、详情、推荐和后台发布。" />;
}
