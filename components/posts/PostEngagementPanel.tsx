"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { Eye, Flag, Heart, Share2 } from "lucide-react";
import { recordPostView, submitPostReport, togglePostFavorite } from "@/features/posts/engagementActions";

type PostEngagementPanelProps = {
  postId: string;
  href: string;
  title: string;
  initialFavoriteCount: number;
  initialViewCount: number;
  initialIsFavorited: boolean;
  initialHasReported: boolean;
};

const reportReasons = [
  { value: "false_information", label: "虚假信息" },
  { value: "expired", label: "已过期" },
  { value: "scam", label: "诈骗/可疑" },
  { value: "invalid_contact", label: "联系方式无效" },
  { value: "illegal", label: "违法/违规" },
  { value: "other", label: "其它" },
];

export function PostEngagementPanel({
  postId,
  href,
  title,
  initialFavoriteCount,
  initialViewCount,
  initialIsFavorited,
  initialHasReported,
}: PostEngagementPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [hasReported, setHasReported] = useState(initialHasReported);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [message, setMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(reportReasons[0].value);
  const [description, setDescription] = useState("");

  const returnTo = useMemo(() => href, [href]);

  useEffect(() => {
    const viewedKey = `openaa:viewed:${postId}`;
    if (window.localStorage.getItem(viewedKey)) return;

    const visitorKey = "openaa:visitor_id";
    let visitorId = window.localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem(visitorKey, visitorId);
    }

    recordPostView(postId, visitorId)
      .then((result) => {
        if (result.ok) {
          window.localStorage.setItem(viewedKey, new Date().toISOString());
          if (typeof result.viewCount === "number") {
            setViewCount(result.viewCount);
          }
        }
      })
      .catch(() => {
        // View tracking should never block the detail page.
      });
  }, [postId]);

  function handleAuthRequired(loginHref?: string) {
    if (loginHref) {
      window.location.href = loginHref;
      return true;
    }

    setMessage("请先登录后再操作。");
    return true;
  }

  function onFavorite() {
    setMessage("");
    startTransition(async () => {
      const result = await togglePostFavorite(postId, returnTo);

      if (result.authRequired) {
        handleAuthRequired(result.loginHref);
        return;
      }

      setMessage(result.message);
      if (result.ok) {
        setIsFavorited(Boolean(result.isFavorited));
        if (typeof result.favoriteCount === "number") {
          setFavoriteCount(result.favoriteCount);
        }
      }
    });
  }

  function onReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await submitPostReport(postId, reason, description, returnTo);

      if (result.authRequired) {
        handleAuthRequired(result.loginHref);
        return;
      }

      setMessage(result.message);
      if (result.ok) {
        setHasReported(true);
        setReportOpen(false);
        setDescription("");
      }
    });
  }

  function onShare() {
    const url = new URL(href, window.location.origin).toString();

    if (navigator.share) {
      navigator.share({ title, url }).catch(() => undefined);
      return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => setMessage("链接已复制。"))
      .catch(() => setMessage("复制失败，请手动复制页面链接。"));
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={onShare} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-slate-50 text-sm font-bold text-slate-700">
          <Share2 size={16} aria-hidden="true" />
          分享
        </button>
        <button
          type="button"
          onClick={onFavorite}
          disabled={isPending}
          className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
            isFavorited ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"
          }`}
        >
          <Heart size={16} aria-hidden="true" fill={isFavorited ? "currentColor" : "none"} />
          {isFavorited ? "已收藏" : "收藏"}
          <span className="text-xs opacity-75">{favoriteCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setReportOpen((open) => !open)}
          disabled={isPending || hasReported}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Flag size={16} aria-hidden="true" />
          {hasReported ? "已举报" : "举报"}
        </button>
        <div className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-slate-50 text-sm font-bold text-slate-700">
          <Eye size={16} aria-hidden="true" />
          浏览：{viewCount}
        </div>
      </div>

      {reportOpen ? (
        <form onSubmit={onReportSubmit} className="space-y-3 rounded-xl bg-slate-50 p-3">
          <label className="block text-xs font-black text-slate-700">
            举报原因
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400"
            >
              {reportReasons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-black text-slate-700">
            详细说明（可选）
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              placeholder="补充说明违规或可疑之处"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isPending} className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:opacity-60">
              提交举报
            </button>
            <button type="button" onClick={() => setReportOpen(false)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600">
              取消
            </button>
          </div>
        </form>
      ) : null}

      {message ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{message}</p> : null}
    </section>
  );
}
