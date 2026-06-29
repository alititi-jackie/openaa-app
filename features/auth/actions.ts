"use server";

import { validateNickname } from "@/features/auth/nicknameValidation";
import { confirmationEmailRedirectTo } from "@/lib/auth/confirmationEmail";
import { authErrorMessage, isAlreadyRegisteredError } from "@/lib/auth/errorMessages";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { safeReturnTo } from "@/lib/auth/redirects";
import { hasAdminExemption } from "@/lib/permissions/admin";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthActionResult = {
  ok: boolean;
  message?: string;
  isAlreadyRegistered?: boolean;
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

export async function canCurrentUserUseReservedNickname() {
  return hasAdminExemption("rename_limit");
}

type NicknameActionOptions = {
  allowCurrentAdminReservedNickname?: boolean;
};

type RegisterWithPasswordInput = {
  email: string;
  password: string;
  nickname: string;
  accepted: boolean;
  authReturnTo?: string;
};

const currentPasswordErrorMessage = "当前密码错误，请重新输入";
const registerServiceUnavailableMessage = "Supabase 环境变量尚未配置，暂时无法注册。";
const updatePasswordServiceUnavailableMessage = "Supabase 环境变量尚未配置，暂时无法更新密码。";
const signInAgainMessage = "登录状态已失效，请重新登录。";
const registerFallbackMessage = "注册失败，请重试";
const updatePasswordFallbackMessage = "修改密码失败，请稍后重试";

export async function validateNicknameForSave(value: string, options: NicknameActionOptions = {}): Promise<NicknameActionResult> {
  return validateNickname(value, {
    allowReservedNicknames: options.allowCurrentAdminReservedNickname ? await canCurrentUserUseReservedNickname() : false,
  });
}

export async function registerWithPassword(input: RegisterWithPasswordInput): Promise<AuthActionResult> {
  const normalizedEmail = input.email.trim();

  if (!normalizedEmail) {
    return { ok: false, message: "请输入邮箱" };
  }

  const nicknameResult = await validateNicknameForSave(input.nickname);

  if (!nicknameResult.ok) {
    return nicknameResult;
  }

  const passwordResult = validatePasswordPolicy(input.password, { email: normalizedEmail });

  if (!passwordResult.ok) {
    return { ok: false, message: passwordResult.message };
  }

  if (!input.accepted) {
    return { ok: false, message: "请先同意服务条款和隐私政策。" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: registerServiceUnavailableMessage };
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: input.password,
    options: {
      emailRedirectTo: confirmationEmailRedirectTo(safeReturnTo(input.authReturnTo)),
      data: {
        nickname: nicknameResult.nickname,
        consent_version: "2026-05-31",
        accepted_terms: true,
        accepted_privacy: true,
      },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      return { ok: false, isAlreadyRegistered: true };
    }

    return { ok: false, message: authErrorMessage(error, registerFallbackMessage) };
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: false, isAlreadyRegistered: true };
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  return { ok: true };
}

export async function updateRecoveredPassword(newPassword: string): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: updatePasswordServiceUnavailableMessage };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: signInAgainMessage };
  }

  const passwordResult = validatePasswordPolicy(newPassword, { email: user.email ?? null });

  if (!passwordResult.ok) {
    return { ok: false, message: passwordResult.message };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { ok: false, message: authErrorMessage(error, updatePasswordFallbackMessage) };
  }

  return { ok: true };
}

export async function changeCurrentPassword(currentPassword: string, newPassword: string): Promise<AuthActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: updatePasswordServiceUnavailableMessage };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { ok: false, message: signInAgainMessage };
  }

  const passwordResult = validatePasswordPolicy(newPassword, { email: user.email });

  if (!passwordResult.ok) {
    return { ok: false, message: passwordResult.message };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { ok: false, message: currentPasswordErrorMessage };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError) {
    return { ok: false, message: authErrorMessage(updateError, updatePasswordFallbackMessage) };
  }

  return { ok: true };
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
