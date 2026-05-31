import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "反馈",
  description: "向 OpenAA 提交问题、建议或内容反馈。",
  path: "/feedback",
});

export default function FeedbackPage() {
  return <PlaceholderPage title="反馈" description="反馈入口占位，后续接入匿名/登录反馈、举报和后台处理流程。" />;
}
