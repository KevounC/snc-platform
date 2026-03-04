import { cors } from "hono/cors";

import { config, parseOrigins } from "../config.js";

// ── Public API ──

/**
 * CORS middleware configured from `config.CORS_ORIGIN`.
 *
 * Supports a single origin (`http://localhost:3001`) or a comma-separated
 * list (`http://localhost:3001,https://app.example.com`).
 */
export const corsMiddleware = cors({
  origin: parseOrigins(config.CORS_ORIGIN),
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
