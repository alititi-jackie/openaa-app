"use client";

import { useState } from "react";
import { Eye, Mail, Phone } from "lucide-react";

type ContactPayload = {
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  preferred_contact_method: string | null;
  message?: string;
};

export function ContactRevealCard({ postId }: { postId: string }) {
  const [contact, setContact] = useState<ContactPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">联系方式</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">联系方式默认隐藏。点击后通过受控接口读取，列表页不会暴露联系方式。</p>

      {contact ? (
        <div className="mt-4 space-y-2 text-sm">
          <ContactRow label="联系人" value={contact.contact_name} />
          <ContactRow label="电话" value={contact.phone} icon={<Phone size={15} aria-hidden="true" />} />
          <ContactRow label="微信" value={contact.wechat} />
          <ContactRow label="邮箱" value={contact.email} icon={<Mail size={15} aria-hidden="true" />} />
          <ContactRow label="偏好方式" value={contact.preferred_contact_method} />
          {message ? <p className="rounded-lg bg-slate-50 p-3 text-slate-600">{message}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={revealContact}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Eye size={17} aria-hidden="true" />
          {loading ? "读取中..." : "查看联系方式"}
        </button>
      )}

      {!contact && message ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p> : null}
    </section>
  );
}

function ContactRow({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
        {icon}
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-slate-900">{value}</span>
    </div>
  );
}
