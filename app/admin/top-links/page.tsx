import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminTopLinksPage() {
  redirect("/admin/navigation?tab=top-links");
}
