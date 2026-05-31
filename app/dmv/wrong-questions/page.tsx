import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "DMV 错题练习",
  description: "纽约 DMV 中文错题练习占位。",
  path: "/dmv/wrong-questions",
  noIndex: true,
});

export default function DmvWrongQuestionsPage() {
  return <PageShell title="DMV 错题练习" description="个人错题入口占位。本阶段不接用户错题数据。" eyebrow="DMV" />;
}
