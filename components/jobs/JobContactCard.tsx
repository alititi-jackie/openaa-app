"use client";

import { useState } from "react";
import type { ContactReveal } from "@/features/posts/types";

export function JobContactCard({ postId }: { postId: string }) {
  const [contact, setContact] = useState<ContactReveal | null>(null);
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function reveal() {
    setLoading(true);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/posts/${postId}/contact`, { cache: "no-store" });
      const payload = (await response.json()) as ContactReveal & { message?: string };
      if (!response.ok) {
        setMessage(payload.message ?? "暂无可公开查看的联系方式。");
        return;
      }
      setContact(payload);
      setMessage(payload.message);
    } catch {
      setMessage("联系方式暂时不可查看，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function copyWechat() {
    if (!contact?.wechat) return;
    await navigator.clipboard.writeText(contact.wechat);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!contact) {
    return (
      <div className="mt-4 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={reveal}
          disabled={loading}
          className="mb-4 w-full rounded-2xl border border-gray-100 bg-white p-4 text-center text-base font-medium text-blue-600 shadow-sm disabled:opacity-60"
        >
          {loading ? "加载中..." : "查看联系方式"}
        </button>
        {message ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">联系招聘方</h2>
        <div className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
          {contact.contact_name ? <p>联系人：{contact.contact_name}</p> : null}
          {contact.phone ? <p>电话：{contact.phone}</p> : null}
          {contact.wechat ? <p>微信：{contact.wechat}</p> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="rounded-lg bg-[#1976d2] px-3 py-2 text-sm font-semibold text-white">
              拨打电话
            </a>
          ) : null}
          {contact.wechat ? (
            <button type="button" onClick={copyWechat} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
              {copied ? "已复制" : "复制微信号"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
