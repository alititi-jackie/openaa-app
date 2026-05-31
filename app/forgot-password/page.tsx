import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "忘记密码",
  description: "重置 OpenAA 账号密码。",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
