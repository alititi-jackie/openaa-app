import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "DMV 模拟考试",
  description: "纽约 DMV 中文模拟考试占位。",
  path: "/dmv/mock-test",
  noIndex: true,
});

export default function DmvMockTestPage() {
  return <PageShell title="DMV 模拟考试" description="模拟考试占位。本阶段不实现答题逻辑。" eyebrow="DMV" />;
}
