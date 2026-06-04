import { redirect } from "next/navigation";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfileSecondhandPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/secondhand");
  }

  redirect("/profile/marketplace");
}
