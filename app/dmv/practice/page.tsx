import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "DMV 练习模式",
  description: "纽约 DMV 中文练习模式占位。",
  path: "/dmv/practice",
});

export default function DmvPracticePage() {
  return <PageShell title="DMV 练习模式" description="练习模式占位。本阶段不实现答题逻辑。" eyebrow="DMV" />;
}
