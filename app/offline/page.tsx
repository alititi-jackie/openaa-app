import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "离线页面",
  description: "网络不可用时的 OpenAA 离线提示。",
  path: "/offline",
  noIndex: true,
});

export default function OfflinePage() {
  return <PlaceholderPage title="当前离线" description="请检查网络连接。后续 PWA 阶段会完善离线缓存与重试体验。" />;
}
