const minNicknameLength = 4;
export const nicknameLengthHint = "至少 2 个汉字，或 4 个英文字母或数字，支持混合输入。";
export const unavailableNicknameMessage = "该用户名无法使用，请换一个用户名。";

const reservedNicknameKeywords = [
  "openaa",
  "管理员",
  "官方",
  "客服",
  "平台",
  "站长",
  "系统",
  "认证",
  "审核",
  "运营",
  "管理员账号",
  "官方账号",
  "官方客服",
  "平台客服",
  "admin",
  "administrator",
  "official",
  "support",
  "system",
  "root",
  "staff",
  "moderator",
  "operator",
  "service",
  "helpdesk",
];

type NicknameValidationOptions = {
  allowReservedNicknames?: boolean;
};

export function normalizeNickname(value: string) {
  return value.trim();
}

export function isReservedNickname(value: string) {
  const normalized = normalizeNickname(value).toLowerCase();

  return reservedNicknameKeywords.some((keyword) => normalized.includes(keyword));
}

export function validateNickname(value: string, options: NicknameValidationOptions = {}) {
  const nickname = normalizeNickname(value);

  const nicknameLength = nickname.replace(/[\p{Unified_Ideograph}〇]/gu, "aa").length;

  if (nicknameLength < minNicknameLength) {
    return { ok: false as const, message: `用户名长度不足。${nicknameLengthHint}` };
  }

  if (isReservedNickname(nickname) && !options.allowReservedNicknames) {
    return { ok: false as const, message: unavailableNicknameMessage };
  }

  return { ok: true as const, nickname };
}
