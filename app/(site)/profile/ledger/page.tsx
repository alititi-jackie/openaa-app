import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { BackButton } from "@/components/common/BackButton";
import { Ledger } from "@/features/ledger/Ledger";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "生活收支账本",
  robots: { index: false, follow: false },
};
export default async function LedgerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=%2Fprofile%2Fledger");
  const preference = (await cookies()).get("ledger-mode-" + user.id)?.value;
  const initialMode =
    preference === "income" ||
    preference === "expense" ||
    preference === "remittance"
      ? preference
      : "full";
  return (
    <div className="mx-auto max-w-3xl space-y-3 pb-24">
      <BackButton href="/profile" label="我的" />
      <Ledger key={user.id} owner={user.id} initialMode={initialMode} />
    </div>
  );
}
