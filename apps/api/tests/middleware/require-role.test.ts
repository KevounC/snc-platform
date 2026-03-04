import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

import type { AuthEnv } from "../../src/middleware/auth-env.js";
import { makeMockUser, makeMockSession } from "../helpers/auth-fixtures.js";

// ── Test Fixtures ──

const MOCK_USER = makeMockUser();
const MOCK_SESSION = makeMockSession();

// ── Mock Setup ──

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

/**
 * Build a minimal Hono app with requireRole middleware.
 *
 * - Mocks `db` to control the userRoles query result.
 * - Mocks `auth` to prevent Better Auth initialization.
 * - Simulates `requireAuth` having already run by setting user/session
 *   on context via a preceding middleware.
 */
const setupRoleApp = async (
  requiredRoles: string[],
  userRoleValues: string[],
): Promise<Hono<AuthEnv>> => {
  mockWhere.mockResolvedValue(
    userRoleValues.map((role) => ({ role })),
  );
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  vi.doMock("../../src/db/connection.js", () => ({
    db: { select: mockSelect },
  }));

  vi.doMock("../../src/auth/auth.js", () => ({
    auth: { api: { getSession: vi.fn() } },
  }));

  const { requireRole } = await import(
    "../../src/middleware/require-role.js"
  );

  const { errorHandler } = await import(
    "../../src/middleware/error-handler.js"
  );

  const app = new Hono<AuthEnv>();
  app.onError(errorHandler);

  // Simulate requireAuth having already run
  app.use("*", async (c, next) => {
    c.set("user", MOCK_USER as any);
    c.set("session", MOCK_SESSION as any);
    await next();
  });

  app.get(
    "/protected",
    requireRole(...(requiredRoles as any)),
    (c) => {
      return c.json({ roles: c.get("roles") });
    },
  );

  return app;
};

// ── Tests ──

describe("requireRole middleware", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockFrom.mockReset();
    mockWhere.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("passes when user has the required role", async () => {
    const app = await setupRoleApp(
      ["creator"],
      ["subscriber", "creator"],
    );
    const res = await app.request("/protected");
    expect(res.status).toBe(200);
  });

  it("returns 403 when user lacks the required role", async () => {
    const app = await setupRoleApp(
      ["creator"],
      ["subscriber"],
    );
    const res = await app.request("/protected");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toStrictEqual({
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      },
    });
  });

  it("passes when user has one of multiple required roles", async () => {
    const app = await setupRoleApp(
      ["creator", "cooperative-member"],
      ["cooperative-member"],
    );
    const res = await app.request("/protected");
    expect(res.status).toBe(200);
  });

  it("returns 403 when user lacks all of multiple required roles", async () => {
    const app = await setupRoleApp(
      ["creator", "cooperative-member"],
      ["subscriber"],
    );
    const res = await app.request("/protected");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("sets all user roles on context after passing", async () => {
    const app = await setupRoleApp(
      ["subscriber"],
      ["subscriber", "creator"],
    );
    const res = await app.request("/protected");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.roles).toStrictEqual(["subscriber", "creator"]);
  });

  it("queries userRoles table with the correct userId", async () => {
    const app = await setupRoleApp(
      ["subscriber"],
      ["subscriber"],
    );
    await app.request("/protected");
    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockFrom).toHaveBeenCalledOnce();
    expect(mockWhere).toHaveBeenCalledOnce();
  });
});
