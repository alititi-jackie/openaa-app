"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detailPayloadForForm, postCategoryForForm, postModeForForm, postPriceForForm, postTitleForForm } from "./adapters";
import { DEFAULT_CITY_SLUG, POST_TYPE_TO_ROUTE } from "./constants";
import { postHref } from "./formMappers";
import { isPostImageEnabled, POST_IMAGE_CONFIG, postImageExtension } from "./imageConfig";
import type { PostFormActionResult, PostFormValues, UploadedImageInput } from "./formTypes";
import type { PostStatus, PostType } from "./types";
import { shouldReviewPost, validatePostForm } from "./validators";

type ProfileStatus = "active" | "restricted" | "banned" | "pending";
type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type ManagePostAction = "hide" | "publish" | "delete";
export type ManagePostActionState = {
  ok: boolean;
  message: string;
  postId?: string;
  action?: ManagePostAction;
};
type WriteContext =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      user: { id: string };
      status: ProfileStatus;
    };

const allowedPostTypes = new Set<PostType>(["job", "housing", "marketplace", "service"]);
const manageablePostStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "hidden", "expired", "deleted"]);
const DEFAULT_DAILY_POST_LIMIT = 10;

async function getWriteContext(): Promise<WriteContext> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, error: "Supabase 环境变量尚未配置，暂时无法保存。" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "请先登录后再发布。" };
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,status").eq("id", user.id).maybeSingle();

  if (profileError) {
    return { ok: false, error: "无法读取账号状态，请稍后再试。" };
  }

  return { ok: true, supabase, user, status: (profile?.status ?? "pending") as ProfileStatus };
}

async function getDefaultCityId(supabase: SupabaseServerClient) {
  const { data } = await supabase.from("cities").select("id").eq("slug", DEFAULT_CITY_SLUG).maybeSingle();
  return data?.id ?? null;
}

function normalizeDailyPostLimit(value: unknown) {
  let candidate: unknown = value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    candidate = record.dailyPostLimit ?? record.daily_post_limit ?? record.limit ?? record.value;
  }
  const parsed = typeof candidate === "number" ? candidate : Number(candidate);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : DEFAULT_DAILY_POST_LIMIT;
}

async function assertDailyPostLimit(supabase: SupabaseServerClient, userId: string) {
  const { data: setting } = await supabase.from("site_settings").select("value").eq("key", "daily_post_limit").maybeSingle();
  const limit = normalizeDailyPostLimit((setting as { value?: unknown } | null)?.value);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .gte("created_at", start.toISOString())
    .neq("status", "deleted");

  if (error) return { ok: false as const, message: "暂时无法验证发帖次数，请稍后再试。" };
  if ((count ?? 0) >= limit) {
    return { ok: false as const, message: `今天发布的信息已达到平台限制（${limit} 条）。` };
  }
  return { ok: true as const };
}

async function assertCanEdit(supabase: SupabaseServerClient, userId: string, postId: string) {
  const { data, error } = await supabase.from("posts").select("id,author_id,status,post_type,published_at").eq("id", postId).maybeSingle();

  if (error || !data) {
    return { ok: false as const, message: "内容不存在或无法编辑。" };
  }

  if (data.author_id !== userId) {
    return { ok: false as const, message: "你只能编辑自己发布的内容。" };
  }

  if (["hidden", "rejected", "deleted"].includes(data.status)) {
    return { ok: false as const, message: "已隐藏、已拒绝或已删除的内容不能由普通用户编辑。" };
  }

  return { ok: true as const, post: data as { id: string; author_id: string; status: string; post_type: PostType; published_at: string | null } };
}

async function getOwnPostForManagement(supabase: SupabaseServerClient, userId: string, postId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id,author_id,status,post_type,published_at")
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const, message: "内容不存在或无法操作。" };
  }

  if (data.author_id !== userId) {
    return { ok: false as const, message: "你只能管理自己发布的内容。" };
  }

  if (!manageablePostStatuses.has(data.status as PostStatus)) {
    return { ok: false as const, message: "当前状态暂不支持自助管理。" };
  }

  return {
    ok: true as const,
    post: data as { id: string; author_id: string; status: PostStatus; post_type: PostType; published_at: string | null },
  };
}

function revalidatePostSurfaces(type: PostType, postId: string, options: { includeProfile?: boolean } = {}) {
  const includeProfile = options.includeProfile ?? true;
  const route = POST_TYPE_TO_ROUTE[type];
  revalidatePath(route);
  revalidatePath(postHref(type, postId));
  if (includeProfile) {
    revalidatePath("/profile/posts");
    revalidatePath(`/profile/${route.slice(1)}`);
  }
}

function mainPostPayload(values: PostFormValues, userId: string, cityId: string | null) {
  const status = shouldReviewPost(values) ? "pending_review" : "published";
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  return {
    post_type: values.postType,
    city_id: cityId,
    author_id: userId,
    title: postTitleForForm(values),
    summary: values.summary.trim() || null,
    body: values.body.trim(),
    category: postCategoryForForm(values),
    subcategory: postModeForForm(values),
    status,
    visibility: values.visibility,
    price_amount: postPriceForForm(values),
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };
}

async function upsertDetail(supabase: SupabaseServerClient, postId: string, values: PostFormValues) {
  const detail = detailPayloadForForm(postId, values);
  if (detail.table === "post_details_jobs") {
    return supabase.from("post_details_jobs").upsert(detail.payload, { onConflict: "post_id" });
  }
  if (detail.table === "post_details_housing") {
    return supabase.from("post_details_housing").upsert(detail.payload, { onConflict: "post_id" });
  }
  if (detail.table === "post_details_marketplace") {
    return supabase.from("post_details_marketplace").upsert(detail.payload, { onConflict: "post_id" });
  }
  return supabase.from("post_details_services").upsert(detail.payload, { onConflict: "post_id" });
}

async function upsertContact(supabase: SupabaseServerClient, postId: string, values: PostFormValues) {
  return supabase.from("post_contacts").upsert(
    {
      post_id: postId,
      contact_name: values.contact.contact_name.trim() || null,
      phone: values.contact.phone.trim() || null,
      wechat: values.contact.wechat.trim() || null,
      email: values.contact.email.trim() || null,
      preferred_contact_method: values.contact.preferred_contact_method,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_id" },
  );
}

export async function createPost(values: PostFormValues): Promise<PostFormActionResult> {
  const validation = validatePostForm(values);
  if (!validation.valid) return { ok: false, message: "表单内容未填写完善，请检查后再发布。", fieldErrors: validation.errors };
  if (!allowedPostTypes.has(values.postType)) return { ok: false, message: "暂不支持该发布类型。" };

  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error };
  if (context.status === "banned") return { ok: false, message: "你的账号当前禁止发布内容。" };
  if (context.status === "restricted") return { ok: false, message: "你的账号当前受限，暂时不能发布新内容。" };

  const limitCheck = await assertDailyPostLimit(context.supabase, context.user.id);
  if (!limitCheck.ok) return { ok: false, message: limitCheck.message };

  const cityId = await getDefaultCityId(context.supabase);
  const { data: post, error: postError } = await context.supabase.from("posts").insert(mainPostPayload(values, context.user.id, cityId)).select("id").single();

  if (postError || !post) return { ok: false, message: postError?.message || "创建内容失败，请稍后再试。" };

  const detailResult = await upsertDetail(context.supabase, post.id, values);
  if (detailResult.error) return { ok: false, message: `内容已创建，但详情保存失败：${detailResult.error.message}` };

  const contactResult = await upsertContact(context.supabase, post.id, values);
  if (contactResult.error) return { ok: false, message: `内容已创建，但联系方式保存失败：${contactResult.error.message}` };

  await syncPostImages(context.supabase, context.user.id, values.postType, post.id, values.images);
  revalidatePath(POST_TYPE_TO_ROUTE[values.postType]);
  return { ok: true, postId: post.id, href: `${postHref(values.postType, post.id)}?created=1` };
}

export async function updatePost(postId: string, values: PostFormValues): Promise<PostFormActionResult> {
  const validation = validatePostForm(values);
  if (!validation.valid) return { ok: false, message: "表单内容未填写完善，请检查后再保存。", fieldErrors: validation.errors };

  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error };
  if (context.status === "banned") return { ok: false, message: "你的账号当前禁止编辑内容。" };

  const editCheck = await assertCanEdit(context.supabase, context.user.id, postId);
  if (!editCheck.ok) return { ok: false, message: editCheck.message };
  if (editCheck.post.post_type !== values.postType) return { ok: false, message: "内容类型不匹配，无法保存。" };

  const mainPayload = mainPostPayload(values, context.user.id, null);
  const { error: postError } = await context.supabase
    .from("posts")
    .update({
      title: mainPayload.title,
      summary: mainPayload.summary,
      body: mainPayload.body,
      category: mainPayload.category,
      visibility: mainPayload.visibility,
      price_amount: mainPayload.price_amount,
      status: editCheck.post.status === "published" ? "published" : editCheck.post.status,
      published_at: editCheck.post.status === "published" ? (editCheck.post.published_at ?? new Date().toISOString()) : null,
      updated_at: mainPayload.updated_at,
    })
    .eq("id", postId)
    .eq("author_id", context.user.id);

  if (postError) return { ok: false, message: postError.message };

  const detailResult = await upsertDetail(context.supabase, postId, values);
  if (detailResult.error) return { ok: false, message: detailResult.error.message };

  const contactResult = await upsertContact(context.supabase, postId, values);
  if (contactResult.error) return { ok: false, message: contactResult.error.message };

  await syncPostImages(context.supabase, context.user.id, values.postType, postId, values.images);
  revalidatePath(postHref(values.postType, postId));
  return { ok: true, postId, href: `${postHref(values.postType, postId)}?updated=1` };
}

export async function manageOwnPostStatus(_previousState: ManagePostActionState, formData: FormData): Promise<ManagePostActionState> {
  const postId = String(formData.get("postId") ?? "");
  const action = String(formData.get("action") ?? "") as ManagePostAction;

  if (!postId || !["hide", "publish", "delete"].includes(action)) {
    return { ok: false, message: "操作参数无效。" };
  }

  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error, postId, action };

  const postCheck = await getOwnPostForManagement(context.supabase, context.user.id, postId);
  if (!postCheck.ok) return { ok: false, message: postCheck.message, postId, action };

  const now = new Date().toISOString();
  const { post } = postCheck;

  if (action === "hide") {
    if (context.status !== "active") {
      return { ok: false, message: "账号受限或禁用时不能下架公开内容。", postId, action };
    }

    if (post.status !== "published") {
      return { ok: false, message: "只有已发布内容可以下架。", postId, action };
    }

    const { error } = await context.supabase
      .from("posts")
      .update({ status: "hidden", hidden_at: now, updated_at: now })
      .eq("id", postId)
      .eq("author_id", context.user.id)
      .select("id")
      .single();

    if (error) return { ok: false, message: "下架失败，请稍后再试。", postId, action };
    revalidatePostSurfaces(post.post_type, postId, { includeProfile: false });
    return { ok: true, message: "已下架，其他用户暂时看不到。", postId, action };
  }

  if (action === "publish") {
    if (context.status !== "active") {
      return { ok: false, message: "账号受限或禁用时不能重新发布。", postId, action };
    }

    if (!["hidden", "draft", "expired"].includes(post.status)) {
      return { ok: false, message: "当前状态不能重新发布。", postId, action };
    }

    const { error } = await context.supabase
      .from("posts")
      .update({
        status: "published",
        published_at: post.published_at ?? now,
        hidden_at: null,
        deleted_at: null,
        updated_at: now,
      })
      .eq("id", postId)
      .eq("author_id", context.user.id)
      .select("id")
      .single();

    if (error) return { ok: false, message: "重新发布失败，请稍后再试。", postId, action };
    revalidatePostSurfaces(post.post_type, postId, { includeProfile: false });
    return { ok: true, message: "已重新发布，内容恢复公开显示。", postId, action };
  }

  if (context.status === "banned") {
    return { ok: false, message: "账号禁用时不能管理内容。", postId, action };
  }

  if (post.status === "deleted") {
    return { ok: false, message: "内容已删除。", postId, action };
  }

  const { error } = await context.supabase
    .from("posts")
    .update({ status: "deleted", deleted_at: now, updated_at: now })
    .eq("id", postId)
    .eq("author_id", context.user.id)
    .select("id")
    .single();

  if (error) return { ok: false, message: "删除失败，请稍后再试。", postId, action };
  revalidatePostSurfaces(post.post_type, postId);
  return { ok: true, message: "已删除，前台不会再显示。", postId, action };
}

async function syncPostImages(supabase: SupabaseServerClient, userId: string, postType: PostType, postId: string, images: UploadedImageInput[]) {
  if (!isPostImageEnabled(postType)) return;

  const keptIds = images.map((image) => image.imageAssetId).filter((id): id is string => Boolean(id));
  const { data: existing } = await supabase.from("post_images").select("image_asset_id").eq("post_id", postId);
  const existingIds = (existing ?? []).map((row) => row.image_asset_id as string);
  const removed = existingIds.filter((id) => !keptIds.includes(id));

  if (removed.length > 0) {
    await supabase.from("post_images").delete().eq("post_id", postId).in("image_asset_id", removed);
    await supabase.from("image_assets").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("owner_id", userId).in("id", removed);
  }

  for (const [index, image] of images.entries()) {
    if (!image.imageAssetId) continue;
    await supabase.from("post_images").upsert(
      {
        post_id: postId,
        image_asset_id: image.imageAssetId,
        sort_order: index,
        is_cover: index === 0,
        caption: image.caption || null,
      },
      { onConflict: "post_id,image_asset_id" },
    );
  }
}

export async function removePostImage(postId: string, imageAssetId: string): Promise<PostFormActionResult> {
  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error };
  if (context.status === "banned") return { ok: false, message: "账号禁用时不能编辑内容。" };

  const editCheck = await assertCanEdit(context.supabase, context.user.id, postId);
  if (!editCheck.ok) return { ok: false, message: editCheck.message };

  await context.supabase.from("post_images").delete().eq("post_id", postId).eq("image_asset_id", imageAssetId);
  await context.supabase
    .from("image_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", imageAssetId)
    .eq("owner_id", context.user.id);

  return { ok: true, postId, href: postHref(editCheck.post.post_type, postId) };
}

export async function uploadPostImage(postId: string, postType: PostType, file: File, sortOrder = 0): Promise<PostFormActionResult> {
  if (!allowedPostTypes.has(postType) || !isPostImageEnabled(postType)) {
    return { ok: false, message: "该类型暂不支持图片上传。" };
  }

  const extension = postImageExtension(file?.type);
  if (!file || file.size <= 0 || file.size > POST_IMAGE_CONFIG.maxUploadBytes || !extension) {
    return { ok: false, message: "请上传 5MB 以内的 JPG、PNG 或 WebP 图片。" };
  }

  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error };
  if (context.status === "banned") return { ok: false, message: "账号禁用时不能编辑内容。" };

  const editCheck = await assertCanEdit(context.supabase, context.user.id, postId);
  if (!editCheck.ok) return { ok: false, message: editCheck.message };
  if (editCheck.post.post_type !== postType) return { ok: false, message: "图片类型与内容类型不匹配。" };

  const imageId = crypto.randomUUID();
  const path = `${postType}/${context.user.id}/${postId}/${imageId}.${extension}`;
  const { error: uploadError } = await context.supabase.storage.from("post-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return { ok: false, message: uploadError.message };

  const { data: publicUrlData } = context.supabase.storage.from("post-images").getPublicUrl(path);
  const { data: asset, error: assetError } = await context.supabase
    .from("image_assets")
    .insert({
      source_type: "storage",
      bucket: "post-images",
      path,
      public_url: publicUrlData.publicUrl,
      owner_id: context.user.id,
      entity_type: "post",
      entity_id: postId,
      mime_type: file.type,
      size_bytes: file.size,
      status: "active",
      is_public: true,
    })
    .select("id")
    .single();

  if (assetError || !asset) return { ok: false, message: assetError?.message || "图片记录保存失败。" };

  await context.supabase.from("post_images").upsert({
    post_id: postId,
    image_asset_id: asset.id,
    sort_order: sortOrder,
    is_cover: sortOrder === 0,
  });

  return { ok: true, postId, href: postHref(postType, postId) };
}
