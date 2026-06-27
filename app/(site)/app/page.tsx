import { AppInstallClient } from "@/components/pwa/AppInstallClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "OpenAA App 下载",
  description: "把 OpenAA 添加到手机或电脑桌面，快速进入纽约华人生活入口。",
  path: "/app",
  noIndex: true,
});

export default function AppInstallPage() {
  return <AppInstallClient />;
}
