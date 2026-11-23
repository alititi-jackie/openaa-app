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

export type LedgerTotals = {
  count: number; amount: number; cny: number; abs_usd: number;
  abs_cny: number; cash: number; card: number;
};
export type Groups = Partial<Record<Kind, LedgerTotals>>;
export type PeriodGroup = {period:string; count:number; amount:number};
export async function readPage(owner: string, book: Kind | "summary", period: string, category: string | null,
  search: string, offset: number, size: number): Promise<{rows: Entry[]; groups: Groups; years:string[]; periods:PeriodGroup[]}> {
  let start: string | null = null, end: string | null = null;
  if (period) {
    if (!/^\d{4}(-\d{2})?$/.test(period)) return {rows: [], groups: {}, years:[], periods:[]};
    start = period + (period.length === 4 ? "-01-01" : "-01");
    const date = new Date(start + "T12:00:00Z");
    if (period.length === 4) date.setUTCFullYear(date.getUTCFullYear() + 1);
    else date.setUTCMonth(date.getUTCMonth() + 1);
    end = date.getUTCFullYear() > 9999 ? null : date.toISOString().slice(0,10);
  }
  const { data, error } = await createSupabaseBrowserClient().rpc("ledger_page", {
    expected_owner: owner, book, start_day: start, end_day: end, category_filter: category,
    term: search.trim(), page_offset: offset, page_size: size
  });
  if (error) throw Error("读取账目失败，请重试");
  return data;
}
