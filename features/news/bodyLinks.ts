export type NewsBodyPart = { text: string; href?: string };

// Only web links are supported. Everything else stays as ordinary escaped text.
const linkPattern = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>]+/gi;
const trailingPunctuation = /[.,!?;:，。！？；：）\])]+$/;

function safeWebUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".") ? value : null;
  } catch {
    return null;
  }
}

export function parseNewsBodyLinks(body: string): NewsBodyPart[] {
  const parts: NewsBodyPart[] = [];
  let cursor = 0;

  for (const match of body.matchAll(linkPattern)) {
    const start = match.index;
    if (start > cursor) parts.push({ text: body.slice(cursor, start) });

    if (match[1] && match[2]) {
      const href = safeWebUrl(match[2]);
      parts.push(href ? { text: match[1], href } : { text: match[0] });
    } else {
      const trailing = match[0].match(trailingPunctuation)?.[0] ?? "";
      const rawUrl = match[0].slice(0, match[0].length - trailing.length);
      const href = safeWebUrl(rawUrl);
      parts.push(href ? { text: rawUrl, href } : { text: rawUrl });
      if (trailing) parts.push({ text: trailing });
    }
    cursor = start + match[0].length;
  }

  if (cursor < body.length) parts.push({ text: body.slice(cursor) });
  return parts;
}
