"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { feedbackTypeOptions, normalizeFeedbackType } from "@/features/feedback/types";

const FEEDBACK_VISITOR_ID_KEY = "openaa_feedback_visitor_id";
const DAILY_LIMIT_HINT = "今日反馈提交数量已达上限，请明天再试。";
const URGENT_CONTACT_HINT = "如有紧急问题，请邮件联系：323748@gmail.com";

type FeedbackSubmitState = {
  ok: boolean;
  message: string;
  result: "idle" | "success" | "limited";
};

export function FeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = useMemo(() => normalizeFeedbackType(searchParams.get("type")), [searchParams]);
  const queryRelatedUrl = useMemo(() => searchParams.get("related_url") ?? "", [searchParams]);
  const visitorIdRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<FeedbackSubmitState>({ ok: true, message: "", result: "idle" });
  const [pending, setPending] = useState(false);

  function handleBackToPrevious() {
    if (typeof window !== "undefined" && (document.referrer !== "" || window.history.length > 2)) {
      window.history.back();
      return;
    }

    router.push("/");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ ok: true, message: "", result: "idle" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const visitorId = ensureVisitorId();
    if (visitorIdRef.current) visitorIdRef.current.value = visitorId;

    setPending(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: String(formData.get("type") ?? "").trim(),
          related_url: String(formData.get("related_url") ?? "").trim() || null,
          contact: String(formData.get("contact") ?? "").trim() || null,
          content: String(formData.get("content") ?? "").trim(),
          visitor_id: visitorId,
        }),
      });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        const message = json?.error || "提交失败，请稍后重试。";
        setState({ ok: false, message, result: response.status === 429 ? "limited" : "idle" });
        return;
      }

      setState({ ok: true, message: "感谢你的反馈，我们会尽快查看并处理。", result: "success" });
    } catch {
      setState({ ok: false, message: "提交失败，请检查网络后稍后重试。", result: "idle" });
    } finally {
      setPending(false);
    }
  }

  if (state.result === "success") {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">提交成功</h1>
          <p className="mt-2 text-sm leading-relaxed text-green-700">感谢你的反馈，我们会尽快查看并处理。</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleBackToPrevious} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            返回上一级
          </button>
          <button type="button" onClick={() => router.push("/")} className="w-full rounded-lg bg-[#1976d2] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1565c0]">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (state.result === "limited") {
    return (
      <div className="rounded-2xl border border-orange-100 bg-white p-5 sm:p-6">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-5 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-xl text-orange-600">!</div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">今日提交已达上限</h1>
          <p className="mt-2 text-sm leading-relaxed text-orange-700">{DAILY_LIMIT_HINT}</p>
          <p className="mt-1 text-sm leading-relaxed text-orange-700">{URGENT_CONTACT_HINT}</p>
          {state.message && !state.message.includes(DAILY_LIMIT_HINT) ? <p className="mt-2 text-xs leading-relaxed text-orange-600">{state.message}</p> : null}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleBackToPrevious} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            返回上一级
          </button>
          <button type="button" onClick={() => router.push("/")} className="w-full rounded-lg bg-[#1976d2] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1565c0]">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">反馈与举报</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">发现虚假信息、诈骗内容、页面错误或建议可提交给 OpenAA</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {!state.ok && state.message ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.message}</div> : null}

        <input ref={visitorIdRef} type="hidden" name="visitor_id" />

        <div>
          <label htmlFor="feedback-type" className="mb-1 block text-sm font-medium text-gray-700">
            反馈类型
          </label>
          <select
            id="feedback-type"
            name="type"
            defaultValue={queryType}
            key={queryType}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          >
            {feedbackTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback-related-url" className="mb-1 block text-sm font-medium text-gray-700">
            相关链接
          </label>
          <input
            id="feedback-related-url"
            name="related_url"
            type="text"
            defaultValue={queryRelatedUrl}
            key={queryRelatedUrl}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
        </div>

        <div>
          <label htmlFor="feedback-contact" className="mb-1 block text-sm font-medium text-gray-700">
            联系方式（选填）
          </label>
          <input
            id="feedback-contact"
            name="contact"
            type="text"
            placeholder="邮箱 / 电话 / 微信，方便我们联系你"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
        </div>

        <div>
          <label htmlFor="feedback-content" className="mb-1 block text-sm font-medium text-gray-700">
            反馈内容
          </label>
          <textarea
            id="feedback-content"
            name="content"
            rows={6}
            placeholder="请尽量描述清楚问题，例如虚假信息、联系方式异常、页面打不开等"
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
        </div>

        <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1976d2] py-2.5 font-medium text-white transition hover:bg-[#1565c0] disabled:opacity-50">
          {pending ? "提交中..." : "提交反馈"}
        </button>
      </form>

      <p className="mt-5 text-sm leading-relaxed text-gray-500">如有紧急问题或需加急处理，请邮件联系：323748@gmail.com，我们会优先查看。</p>
    </>
  );
}

function ensureVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(FEEDBACK_VISITOR_ID_KEY)?.trim();
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(FEEDBACK_VISITOR_ID_KEY, generated);
  return generated;
}
