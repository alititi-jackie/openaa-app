import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "登录",
  description: "登录 OpenAA 账号。",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <PlaceholderPage title="登录" description="Supabase Auth 登录入口占位，后续接入邮箱和 Google 登录。" />;
}
