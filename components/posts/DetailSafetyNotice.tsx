"use client";

import { useRouter } from "next/navigation";

type DetailSafetyNoticeProps = {
  postId: string;
  returnTo: string;
  initialHasReported: boolean;
  className?: string;
};

export function DetailSafetyNotice({ returnTo, className }: DetailSafetyNoticeProps) {
  const router = useRouter();

  function submitFeedbackReport() {
    const params = new URLSearchParams({ type: "信息举报" });
    if (typeof window !== "undefined") {
      params.set("related_url", window.location.href);
    } else {
      params.set("related_url", returnTo);
    }
    router.push(`/feedback?${params.toString()}`);
  }

  return (
    <section className={["mt-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-4", className].filter(Boolean).join(" ")}>
      <h2 className="text-base font-bold text-amber-900">安全提醒</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-amber-900/80">
        本平台信息均由用户自行发布，请注意甄别信息真实性。涉及金钱交易、押金、转账、个人隐私时请提高警惕，谨防诈骗。
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-amber-900/80">发现虚假信息、可疑内容或页面问题？请提交反馈与举报。</p>

      <div className="mt-3">
        <button
          type="button"
          onClick={submitFeedbackReport}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
        >
          提交反馈与举报
        </button>
      </div>
    </section>
  );
}
