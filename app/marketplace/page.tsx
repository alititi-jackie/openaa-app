import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  const resolved = await searchParams;

  for (const [key, value] of Object.entries(resolved ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  }

  redirect(params.size ? `/secondhand?${params.toString()}` : "/secondhand");
}
