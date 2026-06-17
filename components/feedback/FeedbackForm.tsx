"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supportTicketTypeOptions } from "@/features/support/types";

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
  const queryRelatedUrl = useMemo(() => searchParams.get("related_url") ?? "", [searchParams]);
  const queryTargetType = useMemo(() => searchParams.get("target_type") ?? "", [searchParams]);
  const queryTargetId = useMemo(() => searchParams.get("target_id") ?? "", [searchParams]);
  const visitorIdRef = useRef<HTMLInputElement | null>(null);
  const contactRequired = !account.isAuthenticated || !account.hasAccountContact;
  const [state, setState] = useState<FeedbackSubmitState>({ ok: true, message: "", result: "idle" });
  const [pending, setPending] = useState(false);

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
        setState({ ok: false, message: json?.error || "提交失败，请稍后重试。", result: response.status === 429 ? "limited" : "idle" });
        return;
      }

      setState({
        ok: true,
        message: "已收到你的提交，我们会尽快查看。",
        result: "success",
        ticketNo: json?.ticket_no,
      });
    } catch {
      setState({ ok: false, message: "提交失败，请检查网络后重试。", result: "idle" });
    } finally {
      setPending(false);
    }
  }

  if (state.result === "success") {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center sm:px-6">
          <h1 className="text-2xl font-black text-gray-900">提交成功</h1>
          <p className="mt-2 text-sm leading-relaxed text-green-700">{state.message}</p>
          {state.ticketNo ? <p className="mt-2 text-xs font-semibold text-green-700">编号：{state.ticketNo}</p> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => router.back()} className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700">
            返回上一页
          </button>
          <button type="button" onClick={() => router.push("/")} className="min-h-11 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
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
          <h1 className="text-2xl font-black text-gray-900">今日提交已达上限</h1>
          <p className="mt-2 text-sm leading-relaxed text-orange-700">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-black text-gray-900">线索与建议</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        可以提交纽约华人生活相关的新闻线索、广告合作咨询、功能建议，或回复管理员消息。
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {!state.ok && state.message ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{state.message}</div> : null}

        <input ref={visitorIdRef} type="hidden" name="visitor_id" />
        <input type="hidden" name="target_type" value={queryTargetType} />
        <input type="hidden" name="target_id" value={queryTargetId} />

        <label className="grid gap-1.5 text-sm font-bold text-gray-700">
          <span>你反馈的类型 <span className="text-red-600">*</span></span>
          <select
            name="type"
            required
            defaultValue=""
            className="min-h-11 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          >
            <option value="" disabled>请选择类型</option>
            {supportTicketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-bold text-gray-700">
          <span>相关链接</span>
          <input
            name="related_url"
            type="url"
            defaultValue={queryRelatedUrl}
            placeholder="https://..."
            className="min-h-11 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-bold text-gray-700">
          <span>联系方式 {contactRequired ? <span className="text-red-600">*</span> : <span className="font-medium text-gray-400">可选</span>}</span>
          <input
            name="contact_info"
            type="text"
            required={contactRequired}
            maxLength={200}
            placeholder="邮箱 / 电话 / 微信，方便我们联系你"
            className="min-h-11 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
          <span className="text-xs leading-5 text-gray-500">{getContactHint(account)}</span>
        </label>

        <label className="grid gap-1.5 text-sm font-bold text-gray-700">
          <span>内容 <span className="text-red-600">*</span></span>
          <textarea
            name="content"
            rows={6}
            minLength={10}
            maxLength={3000}
            required
            placeholder="请尽量说明清楚，例如新闻线索、活动信息、合作内容、功能建议或回复管理员的具体内容。"
            className="resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => router.back()} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
            取消
          </button>
          <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition disabled:opacity-50">
            {pending ? "提交中..." : "提交"}
          </button>
        </div>
      </form>
    </>
  );
}

function getContactHint(account: FeedbackAccountContext) {
  if (!account.isAuthenticated) return "未登录提交需要填写联系方式，方便我们核实和回复。";
  if (!account.hasAccountContact) return "你的账号暂无联系方式，请填写邮箱 / 电话 / 微信，方便我们回复。";
  return "已登录用户可不填；如需使用其它联系方式，也可以填写。";
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
