import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约 DMV 中文练习",
  description: "OpenAA 纽约 DMV 中文练习题库，仅供学习参考，实际考试内容以 New York DMV 官方资料为准。",
  path: "/dmv",
});

export default function DmvPage() {
  return (
    <PlaceholderPage
      title="DMV 中文练习"
      description="第一版 DMV 初始题库将从 openaa-ny 的审计 JSON 转换为 Supabase dmv_questions，不在运行时读取旧 JSON。"
    />
  );
}
