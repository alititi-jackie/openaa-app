import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "后台",
  description: "OpenAA 后台管理入口。",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return <PlaceholderPage title="后台" description="后台入口占位，后续接入 Supabase Auth、admin_roles、权限点和审计日志。" />;
}
