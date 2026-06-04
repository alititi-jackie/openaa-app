"use server";

import { validateNickname } from "@/features/auth/nicknameValidation";
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

export async function validateNicknameForSave(value: string): Promise<NicknameActionResult> {
  return validateNickname(value);
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
