"use server";

import { validateNickname } from "@/features/auth/nicknameValidation";
import { getCurrentAdminRole } from "@/lib/permissions/admin";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthActionResult = {
  ok: boolean;
  message?: string;
};

type NicknameActionResult =
  | {
      ok: true;
      nickname: string;
    }
  | {
      ok: false;
      message: string;
    };

function allowedReservedNameEmails() {
  return new Set(
    (process.env.OPENAA_RESERVED_NAME_ALLOWED_EMAILS ?? "")
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function canCurrentUserUseReservedOpenAANickname() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();

  if (!email || !allowedReservedNameEmails().has(email)) return false;

  const adminRole = await getCurrentAdminRole();
  return Boolean(adminRole);
}

type NicknameActionOptions = {
  allowCurrentAdminReservedName?: boolean;
};

export async function validateNicknameForSave(value: string, options: NicknameActionOptions = {}): Promise<NicknameActionResult> {
  return validateNickname(value, {
    allowReservedOpenAANames: options.allowCurrentAdminReservedName ? await canCurrentUserUseReservedOpenAANickname() : false,
  });
}

export async function ensureCurrentUserProfile(): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "Please sign in again." };
  }

  try {
    await ensureProfileForUser(user);
    return { ok: true };
  } catch {
    return { ok: false, message: "Profile setup failed. Please try again." };
  }
}
