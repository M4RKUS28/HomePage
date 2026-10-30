const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Return `url` only if it resolves to an http(s) or mailto URL; otherwise '#'.
 * Blocks `javascript:`, `data:`, `vbscript:` etc. in user-controlled hrefs.
 */
export function safeHref(url) {
  if (url === null || url === undefined) return '#';
  const value = String(url).trim();
  if (!value) return '#';
  try {
    const parsed = new URL(value, 'https://placeholder.invalid');
    return SAFE_PROTOCOLS.has(parsed.protocol) ? value : '#';
  } catch {
    return '#';
  }
}
