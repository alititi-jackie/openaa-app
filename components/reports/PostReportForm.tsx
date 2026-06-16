"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reportReasonOptions } from "@/features/reports/types";

const REPORT_VISITOR_ID_KEY = "openaa_report_visitor_id";

type ReportAccountContext = {
  isAuthenticated: boolean;
  hasAccountContact: boolean;
};

type PostReportFormProps = {
  post: {
    id: string;
    title: string;
    typeLabel: string;
    href: string;
  };
  account: ReportAccountContext;
};

type SubmitState = {
  ok: boolean;
  message: string;
  success: boolean;
};

export function PostReportForm({ post, account }: PostReportFormProps) {
  const router = useRouter();
  const visitorIdRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<SubmitState>({ ok: true, message: "", success: false });
  const contactRequired = !account.isAuthenticated || !account.hasAccountContact;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ ok: true, message: "", success: false });

    const formData = new FormData(event.currentTarget);
    const visitorId = ensureVisitorId();
    if (visitorIdRef.current) visitorIdRef.current.value = visitorId;

    setPending(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          reason: String(formData.get("reason") ?? "").trim(),
          detail: String(formData.get("detail") ?? "").trim(),
          contact_info: String(formData.get("contact_info") ?? "").trim(),
          visitor_id: visitorId,
          related_url: typeof window !== "undefined" ? window.location.href : post.href,
        }),
      });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setState({ ok: false, message: json?.error || "举报提交失败，请稍后再试。", success: false });
        return;
      }
      setState({ ok: true, message: "已收到举报，我们会尽快核实处理。", success: true });
    } catch {
      setState({ ok: false, message: "举报提交失败，请检查网络后重试。", success: false });
    } finally {
      setPending(false);
    }
  }

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center">
          <h1 className="text-2xl font-black text-slate-950">举报已提交</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-green-700">{state.message}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => router.push(post.href)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
            返回信息详情
          </button>
          <button type="button" onClick={() => router.push("/")} className="min-h-11 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">举报此信息</h1>
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-bold text-slate-500">{post.typeLabel}</p>
        <p className="mt-1 line-clamp-2 font-black text-slate-950">{post.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {!state.ok && state.message ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{state.message}</div> : null}
        <input ref={visitorIdRef} type="hidden" name="visitor_id" />

        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>举报原因 <span className="text-red-600">*</span></span>
          <select name="reason" required defaultValue="" className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
            <option value="" disabled>请选择举报原因</option>
            {reportReasonOptions().map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>举报内容 <span className="text-red-600">*</span></span>
          <textarea
            name="detail"
            rows={6}
            minLength={10}
            maxLength={1000}
            required
            placeholder="请说明你发现的问题，例如内容不真实、联系方式无法联系、疑似诈骗或信息已经过期。"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>联系方式 {contactRequired ? <span className="text-red-600">*</span> : <span className="font-medium text-slate-400">可选</span>}</span>
          <input
            name="contact_info"
            required={contactRequired}
            maxLength={200}
            placeholder="邮箱 / 电话 / 微信，方便平台核实"
            className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
          />
          <span className="text-xs font-semibold leading-5 text-slate-500">
            {contactRequired ? "未登录或账号暂无联系方式时，必须填写联系方式。" : "已登录账号可不填；如需使用其它联系方式，也可以填写。"}
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => router.push(post.href)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
            取消
          </button>
          <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "提交中..." : "提交举报"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ensureVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(REPORT_VISITOR_ID_KEY)?.trim();
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(REPORT_VISITOR_ID_KEY, generated);
  return generated;
}
