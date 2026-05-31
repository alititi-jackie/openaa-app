import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "忘记密码",
  description: "重置 OpenAA 账号密码。",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <PlaceholderPage title="忘记密码" description="密码重置入口占位，后续接入 Supabase Auth reset password 流程。" />;
}
