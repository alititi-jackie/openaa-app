"use client";

import { useState } from "react";

type ContactPayload = {
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  message?: string;
};

export function ContactRevealCard({ postId, compact = false }: { postId: string; compact?: boolean }) {
  const [contact, setContact] = useState<ContactPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  async function revealContact() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/posts/${postId}/contact`, { method: "GET" });
      const payload = (await response.json()) as ContactPayload;

      if (!response.ok) {
        setMessage(payload.message || "联系方式暂不可查看。");
        return;
      }

      setContact(payload);
      setMessage(payload.message || "");
    } catch {
      setMessage("联系方式读取失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("复制失败");
      setTimeout(() => setCopied(""), 2000);
    }
  }

  const contactName = contact?.contact_name?.trim() ?? "";
  const phone = contact?.phone?.trim() ?? "";
  const wechat = contact?.wechat?.trim() ?? "";
  const email = contact?.email?.trim() ?? "";
  const hasContact = Boolean(contactName || phone || wechat || email);

  return (
    <section className={compact ? "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm" : "rounded-xl border border-slate-100 bg-white p-4 shadow-sm"}>
      {compact ? null : (
        <>
          <h2 className="text-lg font-black text-slate-950">联系方式</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">为保护发布者隐私，联系方式默认隐藏。需要联系时可点击查看，请礼貌沟通并注意甄别信息。</p>
        </>
      )}

      {contact ? (
        <div className="space-y-3">
          {compact ? <h2 className="text-sm font-semibold text-gray-700">联系招聘方</h2> : null}
          {hasContact ? (
            <>
              <div className="space-y-1.5 text-sm text-gray-700">
                {contactName ? <p>联系人：{contactName}</p> : null}
                {phone ? <p>电话：{phone}</p> : null}
                {wechat ? <p>微信：{wechat}</p> : null}
                {email ? <p>邮箱：{email}</p> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {phone ? (
                  <a href={`tel:${phone}`} className="min-w-[120px] flex-1 rounded-xl bg-[#1976d2] py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#1565c0]">
                    📞 拨打电话
                  </a>
                ) : null}
                {wechat ? (
                  <button
                    type="button"
                    onClick={() => copyText(wechat, "微信号已复制")}
                    className="min-w-[120px] flex-1 rounded-xl bg-emerald-500 py-2.5 text-center text-sm font-medium text-white transition hover:bg-emerald-600"
                  >
                    💬 复制微信号
                  </button>
                ) : null}
                {email ? (
                  <button
                    type="button"
                    onClick={() => copyText(email, "邮箱已复制")}
                    className="min-w-[120px] flex-1 rounded-xl border border-blue-100 bg-blue-50 py-2.5 text-center text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    复制邮箱
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">发布者暂未填写联系方式。</p>
          )}
          {copied ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{copied}</p> : null}
          {message ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={revealContact}
          disabled={loading}
          className={
            compact
              ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1976d2] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:opacity-60"
              : "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          }
        >
          {loading ? "读取中..." : "查看联系方式"}
        </button>
      )}

      {!contact && message ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p> : null}
    </section>
  );
}
