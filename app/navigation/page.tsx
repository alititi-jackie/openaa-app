import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约生活导航",
  description: "纽约华人常用网站、本地入口、政府服务和便民导航。",
  path: "/navigation",
});

export default function NavigationPage() {
  return <PlaceholderPage title="生活导航" description="导航频道占位，后续接入公共导航、我的导航和后台分类管理。" />;
}
