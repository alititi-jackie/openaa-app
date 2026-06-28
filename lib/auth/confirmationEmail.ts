import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl } from "@/lib/seo/siteConfig";

export const accountCreatedConfirmationMessage =
  "注册成功，请打开邮箱完成确认。\n请查看来自 Supabase Auth（noreply@mail.app.supabase.io）的确认邮件，并点击邮件中的确认链接完成注册。\n如果没有看到邮件，请检查垃圾邮件、广告邮件或稍后再试。";
export const confirmationEmailSentMessage =
  "确认邮件已重新发送。\n请查看来自 Supabase Auth（noreply@mail.app.supabase.io）的确认邮件，并点击邮件中的确认链接完成注册。\n如果没有看到邮件，请检查垃圾邮件、广告邮件或稍后再试。";

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
