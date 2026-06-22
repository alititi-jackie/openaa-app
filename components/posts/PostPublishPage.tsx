import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues, profileNeedsPublishDefaultsTip, publishContactDefaultsFromProfile } from "@/features/posts/formMappers";
import type { PostType } from "@/features/posts/types";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/server";

export async function PostPublishPage({ postType, returnTo }: { postType: PostType; returnTo: string }) {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired(returnTo);

  const profile = await ensureProfileForUser(user);

  return (
    <PostForm
      mode="create"
      postType={postType}
      initialValues={emptyPostFormValues(postType, publishContactDefaultsFromProfile(profile))}
      showProfileCompletionHint={profileNeedsPublishDefaultsTip(profile)}
    />
  );
}
