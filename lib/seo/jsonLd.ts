export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => {
    if (character === "<") return "\\u003c";
    if (character === ">") return "\\u003e";
    if (character === "&") return "\\u0026";
    if (character === "\u2028") return "\\u2028";
    if (character === "\u2029") return "\\u2029";
    return character;
  });
}
