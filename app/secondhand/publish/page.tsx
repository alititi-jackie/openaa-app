import { redirect } from "next/navigation";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SecondhandPublishPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/secondhand/publish");
  }

  redirect("/marketplace/publish");
}
