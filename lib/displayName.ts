export function accountDisplayName(nickname: string | null | undefined) {
  return nickname?.trim() || "未设置用户名";
}
