const minNicknameLength = 4;

export function normalizeNickname(value: string) {
  return value.trim();
}

export function validateNickname(value: string) {
  const nickname = normalizeNickname(value);

  if (nickname.length < minNicknameLength) {
    return { ok: false as const, message: "昵称至少需要 4 个字符" };
  }

  return { ok: true as const, nickname };
}
