import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "注册",
  description: "注册 OpenAA 账号。",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return <PlaceholderPage title="注册" description="注册入口占位，后续接入邮箱注册、邮箱验证和用户协议同意记录。" />;
}
