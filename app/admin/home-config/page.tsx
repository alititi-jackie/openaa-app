import { redirect } from "next/navigation";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "首页配置管理",
  description: "跳转到 OpenAA 后台首页配置管理。",
  path: "/admin/home-config",
  noIndex: true,
});

export default function AdminHomeConfigRedirectPage() {
  return (
    <AdminAuthGate>
      {async () => {
        redirect("/admin/home");
      }}
    </AdminAuthGate>
  );
}
