import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "搜索",
  description: "搜索 OpenAA 招聘、房屋、二手、本地服务、新闻和 DMV 内容。",
  path: "/search",
  noIndex: true,
});

export default function SearchPage() {
  return <PlaceholderPage title="搜索" description="全局搜索入口占位，后续接入搜索历史、热门搜索和分类筛选。" />;
}
