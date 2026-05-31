import { MessageSquareText, Send } from "lucide-react";
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
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-700">
          <MessageSquareText size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950">反馈</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">提交问题、建议或内容反馈。本阶段只做表单壳，不提交到 Supabase。</p>
      </section>
      <form className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-sm font-bold text-slate-800">反馈类型</span>
          <select className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
            <option>问题反馈</option>
            <option>功能建议</option>
            <option>内容举报</option>
            <option>其他</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">联系方式</span>
          <input
            type="text"
            placeholder="邮箱、电话或微信，可选"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">内容</span>
          <textarea
            rows={5}
            placeholder="请描述你遇到的问题或建议"
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <button type="button" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
          <Send size={18} aria-hidden="true" />
          提交反馈占位
        </button>
        <p className="text-xs leading-5 text-slate-500">你可以匿名反馈。登录用户反馈、举报处理和后台流程会在后续阶段接入。</p>
      </form>
    </div>
  );
}
