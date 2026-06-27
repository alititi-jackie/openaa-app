import { passwordLengthMessage } from "@/lib/auth/passwordPolicy";

const AUTH_ERROR_MESSAGES: Array<[string, string]> = [
  ["invalid login credentials", "邮箱或密码不正确。"],
  ["email not confirmed", "请先验证邮箱后再登录。"],
  ["password should be at least 6 characters", passwordLengthMessage()],
  ["password should be at least 8 characters", passwordLengthMessage()],
  ["token has expired or is invalid", "链接已失效，请重新发送。"],
  ["user already registered", "该邮箱已注册，请直接登录。"],
  ["auth session missing", "登录状态已失效，请重新登录。"],
  ["for security purposes, you can only request this after", "操作太频繁，请稍后再试。"],
  ["unable to validate email address", "邮箱格式不正确。"],
  ["signup requires a valid password", "请输入有效密码。"],
  ["new password should be different from the old password", "密码修改失败，请稍后重试。"],
  ["otp_expired", "链接已失效，请重新发送。"],
  ["invalid_grant", "链接已失效，请重新发送。"],
];

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

export function authErrorMessage(error: unknown, fallback = "操作失败，请稍后再试。") {
  const normalizedMessage = extractMessage(error).trim().toLowerCase();
  if (!normalizedMessage) return fallback;

  const matched = AUTH_ERROR_MESSAGES.find(([needle]) => normalizedMessage.includes(needle));
  return matched?.[1] ?? fallback;
}

export function isEmailNotConfirmedError(error: unknown) {
  return extractMessage(error).trim().toLowerCase().includes("email not confirmed");
}
