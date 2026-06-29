import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DirectoryItem, DirectoryItemRecord, DirectoryItemType, DirectoryPageData, DirectoryQueryResult } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function missingConfig<T>(data: T): DirectoryQueryResult<T> {
  return { state: "missing_config", data };
}

function errorResult<T>(data: T, error: unknown): DirectoryQueryResult<T> {
  const message = error instanceof Error ? error.message : String(error);
  return { state: "error", data, error: message };
}

export async function getCurrentUserDirectoryItems(): Promise<DirectoryQueryResult<DirectoryPageData> & { userId: string | null }> {
  const empty: DirectoryPageData = { phone: [], address: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ...missingConfig(empty), userId: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { state: "ready", data: empty, userId: null };

  try {
    const [phone, address] = await Promise.all([
      readCurrentUserDirectoryItems(supabase, user.id, "phone"),
      readCurrentUserDirectoryItems(supabase, user.id, "address"),
    ]);
    if (phone.error || address.error) return { ...errorResult(empty, phone.error ?? address.error ?? "读取失败"), userId: user.id };

    return {
      state: "ready",
      data: {
        phone: phone.items,
        address: address.items,
      },
      userId: user.id,
    };
  } catch (error) {
    return { ...errorResult(empty, error), userId: user.id };
  }
}

async function readCurrentUserDirectoryItems(supabase: SupabaseServerClient, userId: string, itemType: DirectoryItemType) {
  const { data, error } = await supabase
    .from("personal_directory_items")
    .select("id,user_id,item_type,name,value,sort_order,is_active,created_at,updated_at")
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return {
    items: ((data ?? []) as DirectoryItemRecord[]).map(mapDirectoryItem),
    error: error?.message,
  };
}

function mapDirectoryItem(record: DirectoryItemRecord): DirectoryItem {
  return {
    id: record.id,
    itemType: record.item_type,
    name: record.name,
    value: record.value,
    sortOrder: record.sort_order,
    isActive: record.is_active,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
