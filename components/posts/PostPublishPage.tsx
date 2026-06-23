import Link from "next/link";
import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues, profileNeedsPublishDefaultsTip, publishContactDefaultsFromProfile } from "@/features/posts/formMappers";
import type { PostType } from "@/features/posts/types";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/server";

export async function PostPublishPage({ postType, returnTo }: { postType: PostType; returnTo: string }) {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired(returnTo);

  let profile = null;

  try {
    profile = await ensureProfileForUser(user);
  } catch (error) {
    console.error("[post/publish] ensureProfileForUser failed", error);
    return <ProfilePendingNotice returnTo={returnTo} />;
  }

  return (
    <PostForm
      mode="create"
      postType={postType}
      initialValues={emptyPostFormValues(postType, publishContactDefaultsFromProfile(profile))}
      showProfileCompletionHint={profileNeedsPublishDefaultsTip(profile)}
    />
  );
}

function ProfilePendingNotice({ returnTo }: { returnTo: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
      <h1 className="text-base font-black text-amber-950">资料正在补全中</h1>
      <p className="mt-2">
        你已经登录，但账号资料还没有初始化完成。请稍后刷新，或先进入个人中心确认资料状态。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/profile" className="inline-flex min-h-10 items-center rounded-xl bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800">
          去个人中心
        </Link>
        <Link href={returnTo} className="inline-flex min-h-10 items-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-800 hover:bg-amber-100">
          刷新当前页
        </Link>
      </div>
    </div>
  );
}
