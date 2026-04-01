/**
 * Resolves a stored image path to a full displayable URL.
 *
 * DB stores relative paths like /uploads/products/filename.jpg
 * This function prefixes the backend base URL for rendering.
 *
 * Usage:
 *   resolveImage("/uploads/products/abc.jpg")
 *   → "http://localhost:5000/uploads/products/abc.jpg"
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function resolveImage(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${BASE}${url}`;
  if (url.startsWith("http")) return url;
  return url;
}

/** Returns placeholder if url is empty/missing */
export function resolveImageOrPlaceholder(url?: string | null): string {
  return resolveImage(url) || "/placeholder.png";
}
