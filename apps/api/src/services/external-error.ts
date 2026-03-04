import { AppError } from "@snc/shared";

/**
 * Factory that creates a typed error-wrapping function for an external service.
 * Usage:
 *   const wrapStripeError = wrapExternalError("STRIPE_ERROR");
 *   return err(wrapStripeError(e));
 */
export const wrapExternalError =
  (code: string) =>
  (e: unknown): AppError =>
    new AppError(code, e instanceof Error ? e.message : String(e), 502);
