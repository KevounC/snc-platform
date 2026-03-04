import { describe, it, expect } from "vitest";

import { ok, err, type Result } from "../src/index.js";
import { AppError, NotFoundError, ValidationError } from "../src/index.js";

describe("ok()", () => {
  it("produces { ok: true, value } for a string", () => {
    const result = ok("hello");

    expect(result).toStrictEqual({ ok: true, value: "hello" });
  });

  it("produces { ok: true, value } for a number", () => {
    const result = ok(42);

    expect(result).toStrictEqual({ ok: true, value: 42 });
  });

  it("produces { ok: true, value } for an object", () => {
    const data = { id: 1, name: "test" };
    const result = ok(data);

    expect(result).toStrictEqual({ ok: true, value: data });
  });
});

describe("err()", () => {
  it("produces { ok: false, error } with NotFoundError", () => {
    const error = new NotFoundError("thing not found");
    const result = err(error);

    expect(result).toStrictEqual({ ok: false, error });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error.message).toBe("thing not found");
    }
  });

  it("produces { ok: false, error } with ValidationError", () => {
    const error = new ValidationError("bad input");
    const result = err(error);

    expect(result).toStrictEqual({ ok: false, error });
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });

  it("produces { ok: false, error } with a plain string error", () => {
    const result = err("something went wrong");

    expect(result).toStrictEqual({ ok: false, error: "something went wrong" });
  });
});

describe("Result type narrowing", () => {
  it("narrows to Ok branch when result.ok is true", () => {
    const result: Result<string> = ok("hello");

    if (result.ok) {
      // TypeScript should narrow to Ok<string> — .value is accessible
      const value: string = result.value;
      expect(value).toBe("hello");
    } else {
      // This branch should not execute
      expect.unreachable("Expected ok branch");
    }
  });

  it("narrows to Err branch when result.ok is false", () => {
    const result: Result<string> = err(new AppError("FAIL", "failed"));

    if (!result.ok) {
      // TypeScript should narrow to Err<AppError> — .error is accessible
      const error: AppError = result.error;
      expect(error.code).toBe("FAIL");
      expect(error.message).toBe("failed");
    } else {
      expect.unreachable("Expected err branch");
    }
  });

  it("works with custom error types", () => {
    type CustomError = { kind: "timeout" } | { kind: "network"; url: string };
    const result: Result<number, CustomError> = err({ kind: "timeout" });

    if (!result.ok) {
      expect(result.error.kind).toBe("timeout");
    } else {
      expect.unreachable("Expected err branch");
    }
  });
});

describe("Result default type parameter", () => {
  it("defaults E to AppError when not specified", () => {
    const result: Result<string> = err(new NotFoundError("nope"));

    if (!result.ok) {
      // NotFoundError extends AppError, so this assignment must compile
      const error: AppError = result.error;
      expect(error).toBeInstanceOf(AppError);
    }
  });
});
