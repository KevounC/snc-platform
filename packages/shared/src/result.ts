import { AppError } from "./errors.js";

// ── Public Types ──

/** Success branch of a Result. */
export type Ok<T> = { readonly ok: true; readonly value: T };

/** Failure branch of a Result. */
export type Err<E> = { readonly ok: false; readonly error: E };

/**
 * Discriminated union for service-layer functions that can fail predictably.
 * Defaults to `AppError` as the error type when `E` is not specified.
 */
export type Result<T, E = AppError> = Ok<T> | Err<E>;

// ── Public API ──

/** Create a success Result containing `value`. */
export const ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

/** Create a failure Result containing `error`. */
export const err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
