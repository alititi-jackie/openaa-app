import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl } from "@/lib/seo/siteConfig";

export const accountCreatedConfirmationMessage =
  "注册成功，请打开邮箱完成确认。\n\n请查看来自 Supabase Auth（noreply@mail.app.supabase.io）的确认邮件，并点击邮件中的确认链接完成注册。\n\n如果没有看到邮件，请检查垃圾邮件、广告邮件或促销邮件文件夹。确认邮件可能需要几分钟送达，请不要短时间内重复提交，以免触发邮件发送限制。\n\n如果 1 小时后仍未收到邮件，请再尝试重新注册或联系网站管理员处理。给您带来的不便，我们深表歉意。";
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
