export const AUTHOR_URL = new URL("https://jsantos.pro/");

export function isExactPublicUrl(candidate, expected = AUTHOR_URL) {
  if (typeof candidate !== "string") return false;
  try {
    const parsed = new URL(candidate);
    return parsed.href === expected.href;
  } catch {
    return false;
  }
}
