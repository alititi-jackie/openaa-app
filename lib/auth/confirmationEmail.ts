import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl } from "@/lib/seo/siteConfig";

export const accountCreatedConfirmationMessage = "账号已创建，请前往邮箱点击确认链接。确认后会自动回到 OpenAA。";
export const confirmationEmailSentMessage = "如果该邮箱已注册，确认邮件将发送到该邮箱。";

export function confirmationEmailRedirectTo(returnTo = "/profile") {
  return appUrl(`/auth/callback?returnTo=${encodeURIComponent(returnTo)}`);
}

export function passwordRecoveryRedirectTo() {
  return appUrl("/auth/callback?returnTo=/reset-password");
}

export async function resendSignupConfirmationEmail(supabase: SupabaseClient, email: string, returnTo = "/profile") {
  return supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: confirmationEmailRedirectTo(returnTo),
    },
  });
}
