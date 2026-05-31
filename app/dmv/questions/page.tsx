import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "DMV 题库",
  description: "纽约 DMV 中文题库占位。",
  path: "/dmv/questions",
});

export default function DmvQuestionsPage() {
  return <PageShell title="DMV 题库" description="题库列表占位。后续 Phase 再接 dmv_questions 真实数据。" eyebrow="DMV" />;
}
