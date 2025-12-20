const DEFAULT_SUFFIX = '...';

export function summarizeExcerpt(raw?: string | null, limit = 100, suffix: string = DEFAULT_SUFFIX) {
  if (!raw) return null;
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return null;
  if (limit <= 0) return suffix ? suffix : '';
  if (text.length <= limit) {
    return text;
  }
  const suffixLength = suffix.length;
  const maxContentLength = Math.max(0, limit - suffixLength);
  const slice = text.slice(0, maxContentLength);
  const lastSpace = slice.lastIndexOf(' ');
  const safe = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  const trimmed = safe.trimEnd();
  return `${trimmed || slice}${suffix}`;
}
