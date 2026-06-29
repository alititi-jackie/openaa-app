"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DirectoryItemType } from "./types";
import { parseDirectoryItemType, readText, validateDirectoryItemForm } from "./validators";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type DirectoryActionState = { ok: boolean; message: string; id?: string };

type DirectoryActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const ok = (message: string, id?: string): DirectoryActionState => ({ ok: true, message, id });
const fail = (message: string): DirectoryActionState => ({ ok: false, message });

async function getDirectoryActionContext(): Promise<DirectoryActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "保存失败，请稍后再试。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "登录状态失效，请重新登录。" };
  return { ok: true, supabase, userId: user.id };
}

export async function upsertDirectoryItem(_state: DirectoryActionState, formData: FormData): Promise<DirectoryActionState> {
  const context = await getDirectoryActionContext();
  if (!context.ok) return fail(context.message);

  const validation = validateDirectoryItemForm(formData);
  if (!validation.ok) return fail(validation.message);

  const value = validation.value;
  const sortOrder = value.id ? value.sortOrder : await nextDirectorySortOrder(context, value.itemType);
  const payload = {
    name: value.name,
    value: value.value,
    sort_order: sortOrder,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const result = value.id
    ? await context.supabase
        .from("personal_directory_items")
        .update(payload)
        .eq("id", value.id)
        .eq("user_id", context.userId)
        .eq("item_type", value.itemType)
        .select("id")
        .single()
    : await context.supabase
        .from("personal_directory_items")
        .insert({ ...payload, user_id: context.userId, item_type: value.itemType })
        .select("id")
        .single();

  if (result.error || !result.data) {
    console.error("[directory] upsert failed", {
      userId: context.userId,
      itemId: value.id,
      itemType: value.itemType,
      error: result.error,
    });

    return fail(directorySaveErrorMessage(result.error));
  }

  revalidatePath("/profile/directory");
  return ok(value.id ? "已更新。" : "已保存。", result.data.id);
}

export async function deleteDirectoryItem(_state: DirectoryActionState, formData: FormData): Promise<DirectoryActionState> {
  const context = await getDirectoryActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const itemType = parseDirectoryItemType(readText(formData, "item_type"));
  if (!id) return fail("缺少记录 ID。");
  if (!itemType) return fail("请选择电话本或地址。");

  const { error, data } = await context.supabase
    .from("personal_directory_items")
    .delete()
    .eq("id", id)
    .eq("user_id", context.userId)
    .eq("item_type", itemType)
    .select("id")
    .single();

  if (error || !data) return fail("删除失败，请确认这条记录属于当前账号。");

  revalidatePath("/profile/directory");
  return ok("已删除。");
}

export async function moveDirectoryItem(_state: DirectoryActionState, formData: FormData): Promise<DirectoryActionState> {
  const context = await getDirectoryActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const itemType = parseDirectoryItemType(readText(formData, "item_type"));
  const direction = readText(formData, "direction");
  if (!id) return fail("缺少记录 ID。");
  if (!itemType) return fail("请选择电话本或地址。");
  if (direction !== "up" && direction !== "down") return fail("不支持的排序方向。");

  const { data, error } = await context.supabase
    .from("personal_directory_items")
    .select("id,sort_order,name")
    .eq("user_id", context.userId)
    .eq("item_type", itemType)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return fail("排序读取失败。");

  const items = data ?? [];
  const index = items.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return ok("排序已是当前状态。");

  const normalized = items.map((item, itemIndex) => ({ id: item.id, sort_order: (itemIndex + 1) * 10 }));
  const currentOrder = normalized[index].sort_order;
  normalized[index].sort_order = normalized[targetIndex].sort_order;
  normalized[targetIndex].sort_order = currentOrder;

  for (const item of normalized) {
    const { error: updateError } = await context.supabase
      .from("personal_directory_items")
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("user_id", context.userId)
      .eq("item_type", itemType);

    if (updateError) return fail("排序保存失败。");
  }

  revalidatePath("/profile/directory");
  return ok("排序已更新。");
}

async function nextDirectorySortOrder(context: Extract<DirectoryActionContext, { ok: true }>, itemType: DirectoryItemType) {
  const { data } = await context.supabase
    .from("personal_directory_items")
    .select("sort_order")
    .eq("user_id", context.userId)
    .eq("item_type", itemType)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const currentFirst = typeof data?.sort_order === "number" ? data.sort_order : 0;
  return currentFirst - 10;
}

function directorySaveErrorMessage(error: { code?: string; message?: string } | null) {
  if (error?.code === "42501" || error?.message?.toLowerCase().includes("row-level security")) return "登录状态失效，请重新登录。";
  return "保存失败，请稍后再试。";
}
