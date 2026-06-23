export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordLongEnough(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function passwordLengthMessage(label = "密码") {
  return `${label}至少需要 ${MIN_PASSWORD_LENGTH} 位。`;
}
