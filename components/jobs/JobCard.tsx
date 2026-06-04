import Link from "next/link";
import { formatJobDate, formatJobLocation } from "@/features/jobs/legacy";
import type { PostCardView } from "@/features/posts/types";

export function JobCard({ job }: { job: PostCardView }) {
  const companyName = job.job?.companyName?.trim() || "";

  return (
    <Link href={job.href} className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:bg-zinc-50">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{job.title}</h3>
            {companyName && companyName !== "匿名发布" ? <p className="mt-1 line-clamp-1 break-all text-gray-600">{companyName}</p> : null}
          </div>
          {job.job?.jobType ? (
            <span className="max-w-[9rem] shrink-0 truncate rounded bg-blue-50 px-2 py-1 text-sm font-medium text-[#1976d2]">{job.job.jobType}</span>
          ) : null}
        </div>

        <p className="mt-2 font-semibold text-green-600">{job.job?.salary ?? "薪资电议"}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {job.job?.isPinned ? (
            <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">置顶</span>
          ) : null}
          <span>📍 {formatJobLocation(job.job?.workArea ?? job.location)}</span>
          {job.job?.category ? (
            <>
              <span>·</span>
              <span>{job.job.category}</span>
            </>
          ) : null}
        </div>

        <div className="mt-3">
          <p className="line-clamp-2 text-sm text-gray-500">{job.description}</p>
          <span className="mt-1 block text-xs text-gray-400">{formatJobDate(job.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
