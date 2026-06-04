import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { formatJobDate, formatJobLocation } from "@/features/jobs/legacy";
import type { PostDetailView as PostDetailViewData } from "@/features/posts/types";
import { JobContactCard } from "./JobContactCard";

export function JobDetailLegacyView({ post }: { post: PostDetailViewData | null }) {
  if (!post) {
    return <EmptyState title="招聘信息不存在" description="该招聘信息不存在或暂不可公开访问。" />;
  }

  const companyName = post.job?.companyName?.trim() || "";
  const summary = `${post.job?.jobType ?? "招聘"} · ${formatJobLocation(post.job?.workArea ?? post.location)} · ${post.job?.salary ?? "薪资电议"}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/jobs" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
          ← 返回
        </Link>
        <button type="button" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
          分享
        </button>
      </div>

      <article className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            {companyName && companyName !== "匿名发布" ? <p className="mt-1 text-lg text-gray-600">{companyName}</p> : null}
          </div>
          {post.job?.jobType ? <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#1976d2]">{post.job.jobType}</span> : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs text-gray-500">薪资</p>
            <p className="font-semibold text-green-600">{post.job?.salary ?? "薪资电议"}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">工作地点</p>
            <p className="font-semibold text-gray-900">📍 {formatJobLocation(post.job?.workArea ?? post.location)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {post.job?.category ? <span className="rounded bg-gray-100 px-2 py-1">{post.job.category}</span> : null}
          <span>浏览 {post.viewCount || 0} 次</span>
          <span>{formatJobDate(post.createdAt)}</span>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <h2 className="mb-3 font-semibold text-gray-900">{post.job?.mode === "seeking" ? "个人简介" : "职位描述"}</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{post.body}</p>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            联系前请自行核实信息真实性，涉及转账、押金、证件等敏感事项请谨慎处理。
          </div>
        </div>

        <JobContactCard postId={post.id} />

        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            <p className="font-semibold text-gray-900">分享信息</p>
            <p className="mt-1">{summary}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
