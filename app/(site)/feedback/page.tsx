import { Suspense } from "react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "反馈与举报",
  description: "发现虚假信息、诈骗内容、页面错误或建议可提交给 OpenAA。",
  path: "/feedback",
  noIndex: true,
});

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">加载中...</div>}>
          <FeedbackForm />
        </Suspense>
      </div>
    </div>
  );
}
