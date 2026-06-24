export type UrlValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function normalizeWebsiteUrl(raw: string, options: { allowInternalPath?: boolean; requiredMessage?: string; invalidMessage?: string } = {}): UrlValidationResult<string> {
  const value = raw.trim();
  const invalidMessage = options.invalidMessage ?? "网址格式不正确。";
  if (!value) return { ok: false, message: options.requiredMessage ?? "URL 不能为空。" };

  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return { ok: false, message: invalidMessage };
  }

  if (value.startsWith("/")) {
    if (!options.allowInternalPath || value.startsWith("//")) return { ok: false, message: invalidMessage };
    return { ok: true, value };
  }

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, message: invalidMessage };
    if (!url.hostname.includes(".") || /\s/.test(url.hostname)) return { ok: false, message: invalidMessage };
    url.protocol = "https:";
    return { ok: true, value: url.pathname === "/" && !url.search && !url.hash ? url.origin : url.toString() };
  } catch {
    return { ok: false, message: invalidMessage };
  }
}
