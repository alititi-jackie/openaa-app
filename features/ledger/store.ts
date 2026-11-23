import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Entry, Kind } from "./model";
export async function readEntries(owner: string, period = "", kind?: Kind) {
  const db = createSupabaseBrowserClient(),
    rows: Entry[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = db
      .from("personal_ledger_entries")
      .select(
        "id,kind,date,amount,method,category,cny,rate,note,revision,created_at",
      )
      .eq("owner_id", owner);
    if (kind) query = query.eq("kind", kind);
    if (period) {
      const start = period.length === 4 ? period + "-01-01" : period + "-01";
      const end = new Date(start + "T12:00:00Z");
      if (period.length === 4) end.setUTCFullYear(end.getUTCFullYear() + 1);
      else end.setUTCMonth(end.getUTCMonth() + 1);
      query = query
        .gte("date", start)
        .lt("date", end.toISOString().slice(0, 10));
    }
    const { data, error } = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("kind")
      .order("id")
      .range(offset, offset + 499);
    if (error) throw Error("读取账目失败，请重试");
    rows.push(...(data as Entry[]));
    if (data.length < 500) return rows;
  }
}
export async function writeEntries(
  owner: string,
  changes: (Entry & { expected?: string; remove?: boolean })[],
) {
  const { error } = await createSupabaseBrowserClient().rpc(
    "save_personal_ledger",
    { expected_owner: owner, changes },
  );
  if (error) throw Error(error.message);
}
