import "server-only";

import type { User } from "@supabase/supabase-js";
import { normalizeNickname, validateNickname } from "@/features/auth/nicknameValidation";
import { createSupabaseServerClient } from "./server";

function metadataString(value: unknown) {
  return typeof value === "string" ? normalizeNickname(value) : "";
}

function nicknameFromUser(user: User) {
  const candidates = [
    metadataString(user.user_metadata?.nickname),
    metadataString(user.user_metadata?.name),
    metadataString(user.user_metadata?.full_name),
    normalizeNickname(user.email?.split("@")[0] ?? ""),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const result = validateNickname(candidate);
    if (result.ok) {
      return result.nickname;
    }
  }

  return null;
}

export async function ensureProfileForUser(user: User) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const email = user.email ?? null;
  const nickname = nicknameFromUser(user);
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const consentVersion =
    typeof user.user_metadata?.consent_version === "string" ? user.user_metadata.consent_version : null;

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  if (existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        email,
        nickname: existingProfile.nickname || nickname,
        email_verified: Boolean(user.email_confirmed_at),
        last_login_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email,
      email_verified: Boolean(user.email_confirmed_at),
      nickname,
      avatar_url: avatarUrl,
      last_login_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (consentVersion && user.user_metadata?.accepted_terms && user.user_metadata?.accepted_privacy) {
    await supabase.from("user_consents").upsert(
      [
        {
          user_id: user.id,
          consent_type: "terms",
          consent_version: consentVersion,
          metadata: { source: "auth_callback" },
        },
        {
          user_id: user.id,
          consent_type: "privacy",
          consent_version: consentVersion,
          metadata: { source: "auth_callback" },
        },
      ],
      { onConflict: "user_id,consent_type,consent_version", ignoreDuplicates: true },
    );
  }

  return data;
}
