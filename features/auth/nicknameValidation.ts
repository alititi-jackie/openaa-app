const minNicknameLength = 4;
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

const allowedReservedOpenAANicknames = ["openaa", "openaa 管理员"];

type NicknameValidationOptions = {
  allowReservedOpenAANames?: boolean;
};

export function normalizeNickname(value: string) {
  return value.trim();
}

function normalizeReservedNickname(value: string) {
  return normalizeNickname(value).toLowerCase().replace(/\s+/g, " ");
}

export function isAllowedReservedOpenAANickname(value: string) {
  const normalized = normalizeReservedNickname(value);
  return allowedReservedOpenAANicknames.includes(normalized);
}

export function isReservedNickname(value: string) {
  const normalized = normalizeNickname(value).toLowerCase();

  return reservedNicknameKeywords.some((keyword) => normalized.includes(keyword));
}

export function validateNickname(value: string, options: NicknameValidationOptions = {}) {
  const nickname = normalizeNickname(value);

  if (nickname.length < minNicknameLength) {
    return { ok: false as const, message: "昵称至少需要 4 个字符" };
  }

  const canUseAllowedReservedName = options.allowReservedOpenAANames && isAllowedReservedOpenAANickname(nickname);

  if (isReservedNickname(nickname) && !canUseAllowedReservedName) {
    return { ok: false as const, message: unavailableNicknameMessage };
  }

  return { ok: true as const, nickname };
}
