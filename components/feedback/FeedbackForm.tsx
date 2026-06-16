"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeSupportTicketType, supportTicketTypeOptions } from "@/features/support/types";

const SUPPORT_VISITOR_ID_KEY = "openaa_support_visitor_id";

type FeedbackAccountContext = {
  isAuthenticated: boolean;
  hasAccountContact: boolean;
  profile: {
    userId: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
    wechatId: string | null;
    whatsapp: string | null;
    preferredContactMethod: string | null;
  } | null;
};

type FeedbackSubmitState = {
  ok: boolean;
  message: string;
  result: "idle" | "success" | "limited";
  ticketNo?: string;
};

export function FeedbackForm({ account }: { account: FeedbackAccountContext }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = useMemo(() => normalizeSupportTicketType(searchParams.get("type")), [searchParams]);
  const queryRelatedUrl = useMemo(() => searchParams.get("related_url") ?? "", [searchParams]);
  const queryTargetType = useMemo(() => searchParams.get("target_type") ?? "", [searchParams]);
  const queryTargetId = useMemo(() => searchParams.get("target_id") ?? "", [searchParams]);
  const visitorIdRef = useRef<HTMLInputElement | null>(null);
  const contactRequired = !account.isAuthenticated || !account.hasAccountContact;
  const contactHint = getContactHint(account);
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
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: String(formData.get("type") ?? "").trim(),
          related_url: String(formData.get("related_url") ?? "").trim() || null,
          contact_info: String(formData.get("contact_info") ?? "").trim() || null,
          content: String(formData.get("content") ?? "").trim(),
          visitor_id: visitorId,
          source: "feedback_page",
          target_type: String(formData.get("target_type") ?? "").trim() || null,
          target_id: String(formData.get("target_id") ?? "").trim() || null,
        }),
      });
      const json = (await response.json().catch(() => null)) as { error?: string; ticket_no?: string } | null;

      if (!response.ok) {
        const message = json?.error || "提交失败，请稍后重试。";
        setState({ ok: false, message, result: response.status === 429 ? "limited" : "idle" });
        return;
      }

      setState({
        ok: true,
        message: "感谢你的反馈，我们会尽快查看并处理。",
        result: "success",
        ticketNo: json?.ticket_no,
      });
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
          {state.ticketNo ? <p className="mt-2 text-xs font-semibold text-green-700">工单编号：{state.ticketNo}</p> : null}
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
          <p className="mt-2 text-sm leading-relaxed text-orange-700">{state.message || "今日反馈提交数量已达上限，请明天再试。"}</p>
          <p className="mt-1 text-sm leading-relaxed text-orange-700">如有紧急问题，请邮件联系：323748@gmail.com</p>
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
      <p className="mt-2 text-sm leading-relaxed text-gray-600">发现虚假信息、诈骗内容、页面错误或建议可提交给 OpenAA。</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {!state.ok && state.message ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.message}</div> : null}

        <input ref={visitorIdRef} type="hidden" name="visitor_id" />
        <input type="hidden" name="target_type" value={queryTargetType} />
        <input type="hidden" name="target_id" value={queryTargetId} />

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
            {supportTicketTypeOptions.map((option) => (
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
            type="url"
            defaultValue={queryRelatedUrl}
            key={queryRelatedUrl}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
        </div>

        <div>
          <label htmlFor="feedback-contact" className="mb-1 block text-sm font-medium text-gray-700">
            联系方式{contactRequired ? <span className="ml-1 text-red-600">*</span> : <span className="text-gray-500">（选填）</span>}
          </label>
          <input
            id="feedback-contact"
            name="contact_info"
            type="text"
            required={contactRequired}
            placeholder="邮箱 / 电话 / 微信，方便我们联系你"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
          <p className="mt-1 text-xs leading-5 text-gray-500">{contactHint}</p>
        </div>

        <div>
          <label htmlFor="feedback-content" className="mb-1 block text-sm font-medium text-gray-700">
            反馈内容<span className="ml-1 text-red-600">*</span>
          </label>
          <textarea
            id="feedback-content"
            name="content"
            rows={6}
            required
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

function getContactHint(account: FeedbackAccountContext) {
  if (!account.isAuthenticated) return "未登录提交需要填写联系方式，方便我们核实和回复。";
  if (!account.hasAccountContact) return "你的账号暂无联系方式，请填写邮箱 / 电话 / 微信，方便我们回复。";
  return "已登录用户可不填；后台可通过你的账号信息联系你。如需使用其它联系方式，请在这里填写。";
}

function ensureVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(SUPPORT_VISITOR_ID_KEY)?.trim();
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(SUPPORT_VISITOR_ID_KEY, generated);
  return generated;
}
