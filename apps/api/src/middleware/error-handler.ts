import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { AppError } from "@snc/shared";

// ── Public Types ──

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ── Private Helpers ──

const toErrorBody = (
  code: string,
  message: string,
  details?: unknown,
): ErrorResponseBody => ({
  error: {
    code,
    message,
    ...(details !== undefined && { details }),
  },
});

// ── Public API ──

/**
 * Hono error handler for use with `app.onError()`.
 *
 * - `AppError` instances are mapped to structured JSON at the error's statusCode.
 * - Unknown errors are logged to stderr and returned as 500 INTERNAL_ERROR.
 */
export const errorHandler: ErrorHandler = (e, c) => {
  if (e instanceof AppError) {
    const details = "details" in e ? (e as { details?: unknown }).details : undefined;
    return c.json(toErrorBody(e.code, e.message, details), e.statusCode as ContentfulStatusCode);
  }

  console.error("Unhandled error:", e);

  return c.json(toErrorBody("INTERNAL_ERROR", "Internal server error"), 500);
};
