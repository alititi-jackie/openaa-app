export const MIN_PASSWORD_LENGTH = 6;
export const SIMPLE_PASSWORD_MESSAGE = "密码太简单，请换一个更安全的密码。";

const commonWeakPasswords = new Set([
  "123456",
  "12345678",
  "123456789",
  "password",
  "qwerty",
  "abc123",
]);

export type PasswordPolicyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
      reason: "too_short" | "common_weak_password" | "repeated_digit" | "matches_email_prefix";
    };

type PasswordPolicyOptions = {
  email?: string | null;
};

function emailPrefix(email: string | null | undefined) {
  const normalizedEmail = email?.trim() ?? "";
  if (!normalizedEmail) return "";

  return normalizedEmail.split("@", 1)[0] ?? "";
}

export function isPasswordLongEnough(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function passwordLengthMessage(label = "密码") {
  return `${label}至少需要 ${MIN_PASSWORD_LENGTH} 位。`;
}

export function isCommonWeakPassword(password: string) {
  return commonWeakPasswords.has(password.toLowerCase());
}

export function isRepeatedSingleDigitPassword(password: string) {
  return /^(\d)\1+$/.test(password);
}

export function isPasswordSameAsEmailPrefix(password: string, email: string | null | undefined) {
  const prefix = emailPrefix(email);
  return Boolean(prefix) && password.toLowerCase() === prefix.toLowerCase();
}

export function validatePasswordPolicy(password: string, options: PasswordPolicyOptions = {}): PasswordPolicyResult {
  if (isCommonWeakPassword(password)) {
    return {
      ok: false,
      message: SIMPLE_PASSWORD_MESSAGE,
      reason: "common_weak_password",
    };
  }

  if (isRepeatedSingleDigitPassword(password)) {
    return {
      ok: false,
      message: SIMPLE_PASSWORD_MESSAGE,
      reason: "repeated_digit",
    };
  }

  if (isPasswordSameAsEmailPrefix(password, options.email)) {
    return {
      ok: false,
      message: SIMPLE_PASSWORD_MESSAGE,
      reason: "matches_email_prefix",
    };
  }

  if (!isPasswordLongEnough(password)) {
    return {
      ok: false,
      message: passwordLengthMessage(),
      reason: "too_short",
    };
  }

  return { ok: true };
}
