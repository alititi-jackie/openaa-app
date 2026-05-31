import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "登录回调",
  description: "OpenAA Auth callback.",
  path: "/auth/callback",
  noIndex: true,
});

export default function AuthCallbackPage() {
  return <PlaceholderPage title="登录回调" description="OAuth callback 路由占位，后续接入 Supabase Auth 会话交换逻辑。" />;
}
