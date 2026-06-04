"use client";

import { useState } from "react";

type ContactPayload = {
  contact_name: string | null;
  phone: string | null;
  wechat: string | null;
  message?: string;
};

export function SecondhandContactRevealCard({ postId }: { postId: string }) {
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

  if (contact) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900">联系卖家</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <ContactRow label="联系人" value={contact.contact_name} />
          <ContactRow label="电话" value={contact.phone} />
          <ContactRow label="微信" value={contact.wechat} />
          {message ? <p className="rounded-lg bg-slate-50 p-3 text-slate-600">{message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={revealContact} disabled={loading} className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-center text-base font-medium text-blue-600 shadow-sm disabled:text-gray-400">
        {loading ? "读取中..." : "查看联系方式"}
      </button>
      {message ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{message}</p> : null}
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="min-w-0 truncate text-right text-slate-900">{value}</span>
    </p>
  );
}
