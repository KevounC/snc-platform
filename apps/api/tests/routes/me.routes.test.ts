import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

import { TEST_CONFIG } from "../helpers/test-constants.js";
import { makeMockUser, makeMockSession } from "../helpers/auth-fixtures.js";

// ── Mock Helpers ──

const mockGetSession = vi.fn();
const mockGetUserRoles = vi.fn();

const setupMeApp = async (): Promise<Hono> => {
  vi.doMock("../../src/config.js", () => ({
    config: TEST_CONFIG,
    parseOrigins: (raw: string) =>
      raw
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean),
  }));

  vi.doMock("../../src/auth/auth.js", () => ({
    auth: {
      api: {
        getSession: mockGetSession,
      },
    },
  }));

  vi.doMock("../../src/auth/user-roles.js", () => ({
    getUserRoles: mockGetUserRoles,
  }));

  const { meRoutes } = await import("../../src/routes/me.routes.js");

  const { errorHandler } = await import(
    "../../src/middleware/error-handler.js"
  );

  const { corsMiddleware } = await import("../../src/middleware/cors.js");

  const app = new Hono();
  app.use("*", corsMiddleware);
  app.onError(errorHandler);
  app.route("/api/me", meRoutes);

  return app;
};

// ── Tests ──

describe("GET /api/me", () => {
  let app: Hono;

  beforeEach(async () => {
    mockGetSession.mockReset();
    mockGetUserRoles.mockReset();
    app = await setupMeApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns { user: null } when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await app.request("/api/me");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toStrictEqual({ user: null });
    expect(mockGetUserRoles).not.toHaveBeenCalled();
  });

  it("returns user, session, and roles when authenticated", async () => {
    const user = makeMockUser();
    const session = makeMockSession();
    mockGetSession.mockResolvedValue({ user, session });
    mockGetUserRoles.mockResolvedValue(["subscriber"]);

    const res = await app.request("/api/me", {
      headers: {
        Cookie: "better-auth.session_token=valid_token",
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe("user_test123");
    expect(body.user.email).toBe("test@example.com");
    expect(body.session.token).toBe("tok_test789");
    expect(body.roles).toStrictEqual(["subscriber"]);
  });

  it("returns multiple roles for users with multiple roles", async () => {
    mockGetSession.mockResolvedValue({
      user: makeMockUser(),
      session: makeMockSession(),
    });
    mockGetUserRoles.mockResolvedValue(["subscriber", "cooperative-member"]);

    const res = await app.request("/api/me", {
      headers: {
        Cookie: "better-auth.session_token=valid_token",
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.roles).toStrictEqual(["subscriber", "cooperative-member"]);
  });

  it("calls getUserRoles with the correct user ID", async () => {
    const user = makeMockUser({ id: "user_xyz" });
    const session = makeMockSession({ userId: "user_xyz" });
    mockGetSession.mockResolvedValue({ user, session });
    mockGetUserRoles.mockResolvedValue(["subscriber"]);

    await app.request("/api/me", {
      headers: {
        Cookie: "better-auth.session_token=valid_token",
      },
    });

    expect(mockGetUserRoles).toHaveBeenCalledOnce();
    expect(mockGetUserRoles).toHaveBeenCalledWith("user_xyz");
  });

  it("normalizes user.image from undefined to null", async () => {
    const user = { ...makeMockUser(), image: undefined };
    mockGetSession.mockResolvedValue({
      user,
      session: makeMockSession(),
    });
    mockGetUserRoles.mockResolvedValue(["subscriber"]);

    const res = await app.request("/api/me", {
      headers: {
        Cookie: "better-auth.session_token=valid_token",
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.image).toBeNull();
  });

  it("passes raw request headers to auth.api.getSession", async () => {
    mockGetSession.mockResolvedValue(null);

    await app.request("/api/me", {
      headers: {
        Cookie: "better-auth.session_token=some_token",
      },
    });

    expect(mockGetSession).toHaveBeenCalledOnce();
    const callArg = mockGetSession.mock.calls[0][0];
    expect(callArg).toHaveProperty("headers");
  });
});
