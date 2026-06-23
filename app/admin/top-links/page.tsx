import { redirect } from "next/navigation";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "顶部快捷导航",
  path: "/admin/top-links",
  noIndex: true,
});

export default function AdminTopLinksPage() {
  return (
    <AdminAuthGate>
      {() => {
        redirect("/admin/navigation?tab=top-links");
      }}
    </AdminAuthGate>
  );
}
