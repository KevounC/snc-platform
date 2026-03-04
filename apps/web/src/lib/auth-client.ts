import { createAuthClient } from "better-auth/react";

import { API_BASE_URL } from "./config.js";

// ── Public API ──

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});
