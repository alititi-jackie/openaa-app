import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约罚单查询",
  description: "纽约 DMV 罚单查询入口占位。",
  path: "/dmv/tickets",
  noIndex: true,
});

export default function DmvTicketsPage() {
  return (
    <PageShell title="纽约罚单查询" description="罚单查询入口占位。后续可接外部官方入口或生活工具说明。" eyebrow="DMV">
      <Link href="/dmv" className="inline-flex text-sm font-black text-blue-700 underline underline-offset-4">
        返回 DMV 首页
      </Link>
    </PageShell>
  );
}
