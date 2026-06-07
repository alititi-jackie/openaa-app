import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MarketplacePublishPage() {
  redirect("/secondhand/publish");
}
