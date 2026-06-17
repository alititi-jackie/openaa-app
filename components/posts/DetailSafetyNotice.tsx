"use client";

import { useRouter } from "next/navigation";

type DetailSafetyNoticeProps = {
  postId: string;
  returnTo: string;
  initialHasReported: boolean;
  className?: string;
};

export function DetailSafetyNotice({ postId, returnTo, initialHasReported, className }: DetailSafetyNoticeProps) {
  const router = useRouter();

  function reportPost() {
    const params = new URLSearchParams({ returnTo });
    router.push(`/report/${postId}?${params.toString()}`);
  }

  return (
    <section className={["mt-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-4", className].filter(Boolean).join(" ")}>
      <h2 className="text-base font-bold text-amber-900">安全提醒</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-amber-900/80">
        本平台信息由用户自行发布，请注意辨别信息真实性。涉及金钱交易、押金、转账、个人隐私时请提高警惕。
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-amber-900/80">
        发现虚假信息、可疑内容、联系方式异常或信息过期，可以举报此信息。
      </p>

      <div className="mt-3">
        <button
          type="button"
          onClick={reportPost}
          disabled={initialHasReported}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
        >
          {initialHasReported ? "已举报" : "举报此信息"}
        </button>
      </div>
    </section>
  );
}
