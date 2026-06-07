"use client";

import { useState, useTransition, type FormEvent } from "react";
import { submitPostReport } from "@/features/posts/engagementActions";

type DetailSafetyNoticeProps = {
  postId: string;
  returnTo: string;
  initialHasReported: boolean;
  className?: string;
};

const reportReasons = [
  { value: "false_information", label: "虚假信息" },
  { value: "expired", label: "已过期" },
  { value: "scam", label: "诈骗/可疑" },
  { value: "invalid_contact", label: "联系方式无效" },
  { value: "illegal", label: "违法/违规" },
  { value: "other", label: "其它" },
];

export function DetailSafetyNotice({ postId, returnTo, initialHasReported, className }: DetailSafetyNoticeProps) {
  const [isPending, startTransition] = useTransition();
  const [hasReported, setHasReported] = useState(initialHasReported);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(reportReasons[0].value);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  function onReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await submitPostReport(postId, reason, description, returnTo);

      if (result.authRequired && result.loginHref) {
        window.location.href = result.loginHref;
        return;
      }

      setMessage(result.message);
      if (result.ok) {
        setHasReported(true);
        setReportOpen(false);
        setDescription("");
      }
    });
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
          onClick={() => setReportOpen((open) => !open)}
          disabled={isPending || hasReported}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {hasReported ? "已提交反馈与举报" : "提交反馈与举报"}
        </button>
      </div>

      {reportOpen ? (
        <form onSubmit={onReportSubmit} className="mt-3 space-y-3 rounded-xl bg-white/70 p-3">
          <label className="block text-xs font-semibold text-amber-900">
            举报原因
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-amber-100 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-300"
            >
              {reportReasons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-amber-900">
            详细说明（可选）
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-300"
              placeholder="补充说明可疑之处"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isPending} className="rounded-xl bg-amber-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
              提交
            </button>
            <button type="button" onClick={() => setReportOpen(false)} className="rounded-xl border border-amber-100 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800">
              取消
            </button>
          </div>
        </form>
      ) : null}

      {message ? <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm leading-6 text-amber-900/80">{message}</p> : null}
    </section>
  );
}
