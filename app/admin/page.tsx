import { redirect } from "next/navigation";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "后台",
  description: "OpenAA 后台入口。",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return (
    <AdminAuthGate>
      {() => {
        redirect("/admin/dashboard");
      }}
    </AdminAuthGate>
  );
}
