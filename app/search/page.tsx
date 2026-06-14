import SearchClient from "./SearchClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "搜索",
  description: "搜索 OpenAA 招聘、房屋、二手市场、本地服务、新闻和 DMV 内容。",
  path: "/search",
  noIndex: true,
});

type SearchPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return <SearchClient initialQuery={params?.q ?? ""} />;
}
