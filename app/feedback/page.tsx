import { MessageSquareText } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "反馈",
  description: "向 OpenAA 提交问题、建议或内容反馈。",
  path: "/feedback",
  noIndex: true,
});

export default function FeedbackPage() {
  return (
    <div className="space-y-4">
      <ChannelHero title="反馈" description="提交问题、建议或内容反馈。" icon={MessageSquareText} />
      <FeedbackForm />
    </div>
  );
}
