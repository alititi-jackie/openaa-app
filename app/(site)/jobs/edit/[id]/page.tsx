import { PostEditPage } from "@/components/posts/PostEditPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({ title: "编辑招聘", path: "/jobs/edit", noIndex: true });

export default async function JobsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditPage id={id} postType="job" returnTo={`/jobs/edit/${id}`} />;
}
