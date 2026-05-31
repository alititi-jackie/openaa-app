import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "我的",
  description: "OpenAA 用户中心。",
  path: "/profile",
  noIndex: true,
});

export default function ProfilePage() {
  return <PlaceholderPage title="我的" description="用户中心占位，后续接入资料、发布、收藏、最近浏览、草稿和通知。" />;
}
