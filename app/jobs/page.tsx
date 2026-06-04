import { JobsLegacyPage } from "@/components/jobs/JobsLegacyPage";
import { ALL_JOB_REGIONS, type JobMode } from "@/features/jobs/legacy";
import { getPublicJobPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人招聘",
  description: "纽约华人招聘、求职、兼职、全职信息入口。",
  path: "/jobs",
});

export const dynamic = "force-dynamic";

type JobsPageSearchParams = Promise<{
  type?: string;
  q?: string;
  job_type?: string;
  category?: string;
  location?: string;
}>;

function readJobMode(value?: string): JobMode {
  return value === "seeking" ? "seeking" : "hiring";
}

export default async function JobsPage({ searchParams }: { searchParams: JobsPageSearchParams }) {
  const params = await searchParams;
  const filters = {
    mode: readJobMode(params.type),
    search: params.q?.trim() || undefined,
    jobType: params.job_type?.trim() || undefined,
    category: params.category?.trim() || undefined,
    location: params.location?.trim() || ALL_JOB_REGIONS,
  };
  const posts = await getPublicJobPosts(filters);

  return <JobsLegacyPage filters={filters} posts={posts.data} queryState={posts.state} errorMessage={posts.error} />;
}
