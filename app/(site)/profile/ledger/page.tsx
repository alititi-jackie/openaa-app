import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "@/lib/supabase/server";
import { Ledger } from "@/features/ledger/Ledger";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "生活收支账本",
  manifest: "/ledger.webmanifest",
  appleWebApp: { capable: true, title: "生活账本" },
  robots: { index: false, follow: false },
};
export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ book?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=%2Fprofile%2Fledger");
  const preference = (await cookies()).get("ledger-mode-" + user.id)?.value;
  const fallback =
    preference === "income" ||
    preference === "expense" ||
    preference === "remittance"
      ? preference
      : "full";
  const db = await createSupabaseServerClient();
  const result = await db?.rpc("ledger_display_mode", {
    expected_owner: user.id,
    requested: fallback,
    initialize: true,
  });
  const initialMode = result?.data ?? fallback;
  return (
    <div className="mx-auto max-w-3xl space-y-3 pb-24">
      <Ledger key={user.id} owner={user.id} initialMode={initialMode} requestedBook={(await searchParams).book} />
    </div>
  );
}
