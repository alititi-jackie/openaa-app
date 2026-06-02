"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitFeedback, type FeedbackActionState } from "@/features/feedback/actions";
import { feedbackCategoryOptions } from "@/features/feedback/types";

const initialState: FeedbackActionState = { ok: true, message: "" };

export function FeedbackForm() {
  const [state, formAction, pending] = useActionState(submitFeedback, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <label className="block">
        <span className="text-sm font-bold text-slate-800">反馈类型</span>
        <select name="category" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          {feedbackCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-bold text-slate-800">联系邮箱</span>
        <input
          name="email"
          type="email"
          placeholder="可选，方便我们回复你"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-slate-800">反馈标题</span>
        <input
          name="subject"
          type="text"
          required
          maxLength={120}
          placeholder="简单说明你遇到的问题或建议"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-slate-800">反馈内容</span>
        <textarea
          name="message"
          rows={5}
          required
          maxLength={2000}
          placeholder="请描述你遇到的问题、建议，或需要平台处理的内容"
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
        <Send size={18} aria-hidden="true" />
        {pending ? "提交中..." : "提交反馈"}
      </button>
      {state.message ? (
        <p className={`rounded-xl px-3 py-2 text-sm font-bold ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-slate-500">你可以匿名反馈。登录用户提交的反馈会自动关联账号，便于后续处理。</p>
    </form>
  );
}
