"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CITY_SLUG, POST_TYPE_TO_ROUTE } from "./constants";
import { postHref } from "./formMappers";
import type { PostFormActionResult, PostFormValues, UploadedImageInput } from "./formTypes";
import type { PostType } from "./types";
import { shouldReviewPost, validatePostForm } from "./validators";

type ProfileStatus = "active" | "restricted" | "banned" | "pending";
type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type WriteContext =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      user: { id: string };
      status: ProfileStatus;
    };

const allowedPostTypes = new Set<PostType>(["job", "housing", "marketplace", "service"]);

function numericOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

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

function categoryFor(values: PostFormValues) {
  if (values.postType === "job") return values.job?.job_category || values.job?.job_mode || null;
  if (values.postType === "housing") return values.housing?.room_type || values.housing?.housing_mode || null;
  if (values.postType === "marketplace") return values.marketplace?.category || values.marketplace?.marketplace_mode || null;
  return values.service?.service_category || null;
}

function priceFor(values: PostFormValues) {
  if (values.postType === "housing") return numericOrNull(values.housing?.price ?? "");
  if (values.postType === "marketplace") return numericOrNull(values.marketplace?.price ?? "");
  return null;
}

function mainPostPayload(values: PostFormValues, userId: string, cityId: string | null) {
  const status = shouldReviewPost(values) ? "pending_review" : "published";
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  return {
    post_type: values.postType,
    city_id: cityId,
    author_id: userId,
    title: values.title.trim(),
    summary: values.summary.trim() || null,
    body: values.body.trim(),
    category: categoryFor(values),
    status,
    visibility: values.visibility,
    price_amount: priceFor(values),
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };
}

async function upsertDetail(supabase: SupabaseServerClient, postId: string, values: PostFormValues) {
  if (values.postType === "job") {
    return supabase.from("post_details_jobs").upsert(
      {
        post_id: postId,
        employment_type: values.job?.job_type || values.job?.job_mode || null,
        wage_min: numericOrNull(values.job?.salary_min ?? ""),
        wage_max: numericOrNull(values.job?.salary_max ?? ""),
        wage_unit: values.job?.salary_unit || null,
        job_category: values.job?.job_category || null,
        work_area: values.job?.work_area || values.location_area || null,
        experience_requirement: values.job?.experience_requirement || null,
        language_requirement: values.job?.language_requirement || null,
        includes_meals: Boolean(values.job?.includes_meals),
        includes_housing: Boolean(values.job?.includes_housing),
        requires_work_authorization: values.job?.identity_requirement ? values.job.identity_requirement !== "none" : null,
        employer_type: values.job?.employer_type || values.job?.company_name || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "post_id" },
    );
  }

  if (values.postType === "housing") {
    return supabase.from("post_details_housing").upsert(
      {
        post_id: postId,
        listing_type: values.housing?.housing_mode || null,
        housing_type: values.housing?.room_type || null,
        rent_amount: numericOrNull(values.housing?.price ?? ""),
        deposit_amount: numericOrNull(values.housing?.deposit ?? ""),
        available_date: values.housing?.available_from || null,
        lease_term: values.housing?.lease_type || values.housing?.price_unit || null,
        pets_allowed: Boolean(values.housing?.allow_pets),
        utilities_included: Boolean(values.housing?.utilities_included),
        transit_nearby: values.housing?.transit_nearby || null,
        address_area: values.location_area || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "post_id" },
    );
  }

  if (values.postType === "marketplace") {
    return supabase.from("post_details_marketplace").upsert(
      {
        post_id: postId,
        listing_type: values.marketplace?.marketplace_mode || null,
        item_category: values.marketplace?.category || null,
        condition: values.marketplace?.condition || null,
        price_amount: numericOrNull(values.marketplace?.price ?? ""),
        negotiable: Boolean(values.marketplace?.negotiable),
        trade_area: values.marketplace?.trade_area || values.location_area || null,
        delivery_options: values.marketplace?.delivery_method ? [values.marketplace.delivery_method] : [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "post_id" },
    );
  }

  return supabase.from("post_details_services").upsert(
    {
      post_id: postId,
      service_category: values.service?.service_category || null,
      service_area: values.service?.service_area || values.location_area || null,
      business_hours: values.service?.business_hours_text ? { text: values.service.business_hours_text } : {},
      price_range: values.service?.price_range || values.service?.price_note || null,
      service_status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_id" },
  );
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
  if (!validation.valid) return { ok: false, message: "请检查表单内容。", fieldErrors: validation.errors };
  if (!allowedPostTypes.has(values.postType)) return { ok: false, message: "暂不支持该发布类型。" };

  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error };
  if (context.status === "banned") return { ok: false, message: "你的账号当前禁止发布内容。" };
  if (context.status === "restricted") return { ok: false, message: "你的账号当前受限，暂时不能发布新内容。" };

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
  if (!validation.valid) return { ok: false, message: "请检查表单内容。", fieldErrors: validation.errors };

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

async function syncPostImages(supabase: SupabaseServerClient, userId: string, postType: PostType, postId: string, images: UploadedImageInput[]) {
  if (postType === "job") return;

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
  if (!allowedPostTypes.has(postType) || postType === "job") {
    return { ok: false, message: "该类型暂不支持图片上传。" };
  }

  const context = await getWriteContext();
  if (!context.ok) return { ok: false, message: context.error };

  const editCheck = await assertCanEdit(context.supabase, context.user.id, postId);
  if (!editCheck.ok) return { ok: false, message: editCheck.message };
  if (editCheck.post.post_type !== postType) return { ok: false, message: "图片类型与内容类型不匹配。" };

  const imageId = crypto.randomUUID();
  const path = `${postType}/${context.user.id}/${postId}/${imageId}.webp`;
  const { error: uploadError } = await context.supabase.storage.from("post-images").upload(path, file, {
    contentType: file.type || "image/webp",
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
      mime_type: file.type || "image/webp",
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
