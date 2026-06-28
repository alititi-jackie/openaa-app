import { passwordLengthMessage } from "@/lib/auth/passwordPolicy";

const AUTH_ERROR_MESSAGES: Array<[string, string]> = [
  ["invalid login credentials", "邮箱或密码不正确。"],
  ["email not confirmed", "该邮箱尚未完成确认，请先打开邮箱，点击确认邮件中的链接完成注册。"],
  ["password should be at least 6 characters", passwordLengthMessage()],
  ["password should be at least 8 characters", passwordLengthMessage()],
  ["token has expired or is invalid", "链接已失效，请重新发送。"],
  ["user already registered", "该邮箱可能已经注册过 OpenAA 账号。"],
  ["already registered", "该邮箱可能已经注册过 OpenAA 账号。"],
  ["already exists", "该邮箱可能已经注册过 OpenAA 账号。"],
  ["email already exists", "该邮箱可能已经注册过 OpenAA 账号。"],
  ["邮箱已存在", "该邮箱可能已经注册过 OpenAA 账号。"],
  ["用户已存在", "该邮箱可能已经注册过 OpenAA 账号。"],
  ["auth session missing", "登录状态已失效，请重新登录。"],
  ["for security purposes, you can only request this after", "操作太频繁，请稍后再试。"],
  ["email rate limit exceeded", "操作太频繁，请稍后再试。"],
  ["over_email_send_rate_limit", "操作太频繁，请稍后再试。"],
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
    const code = "code" in error ? (error as { code?: unknown }).code : undefined;
    const errorCode = "error_code" in error ? (error as { error_code?: unknown }).error_code : undefined;
    const parts = [message, code, errorCode].filter((part): part is string => typeof part === "string");
    if (parts.length) return parts.join(" ");
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
  const normalizedMessage = extractMessage(error).trim().toLowerCase();
  return ["email not confirmed", "not confirmed", "邮箱未确认", "邮箱尚未确认"].some((needle) => normalizedMessage.includes(needle));
}

export function isAlreadyRegisteredError(error: unknown) {
  const normalizedMessage = extractMessage(error).trim().toLowerCase();
  return ["user already registered", "already registered", "already exists", "email already exists", "邮箱已存在", "用户已存在"].some((needle) => normalizedMessage.includes(needle));
}
