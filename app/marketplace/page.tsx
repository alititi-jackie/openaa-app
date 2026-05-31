import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约二手市场",
  description: "纽约华人二手市场、闲置交易、求购和本地自取信息。",
  path: "/marketplace",
});

export default function MarketplacePage() {
  return <PlaceholderPage title="二手市场" description="Marketplace 频道占位，URL 固定使用 /marketplace，中文显示为二手市场。" />;
}
