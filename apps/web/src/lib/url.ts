import { API_BASE_URL } from "./config.js";

// ── Public API ──

export function buildMediaUrl(relativePath: string | null): string | null {
  if (!relativePath) {
    return null;
  }
  return `${API_BASE_URL}${relativePath}`;
}
