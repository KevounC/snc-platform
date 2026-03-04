import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { User, Session } from "@snc/shared";

import { TEST_CONFIG } from "../helpers/test-constants.js";
import { makeMockUser, makeMockSession } from "../helpers/auth-fixtures.js";
import { makeMockDbUser } from "../helpers/admin-fixtures.js";

// ── Mock State ──

let mockUser: User | null;
let mockSession: Session | null;
let mockRoles: string[];

// ── Mock DB Chains ──

const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsertOnConflictDoNothing = vi.fn();
const mockInsertValues = vi.fn();
const mockInsert = vi.fn();
const mockDeleteWhere = vi.fn();
const mockDeleteFrom = vi.fn();
const mockDelete = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
};

// ── App Factory ──

const setupAdminApp = async (): Promise<Hono> => {
  const { UnauthorizedError, ForbiddenError } = await import("@snc/shared");

  vi.doMock("../../src/config.js", () => ({
    config: TEST_CONFIG,
    parseOrigins: (raw: string) =>
      raw
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean),
  }));

  vi.doMock("../../src/db/connection.js", () => ({
    db: mockDb,
    sql: vi.fn(),
  }));

  vi.doMock("../../src/db/schema/user.schema.js", () => ({
    users: {
      id: { name: "id" },
      name: { name: "name" },
      email: { name: "email" },
      emailVerified: { name: "email_verified" },
      image: { name: "image" },
      createdAt: { name: "created_at" },
      updatedAt: { name: "updated_at" },
    },
    userRoles: {
      userId: { name: "user_id" },
      role: { name: "role" },
      createdAt: { name: "created_at" },
    },
    sessions: {},
    accounts: {},
    verifications: {},
  }));

  vi.doMock("../../src/middleware/require-auth.js", () => ({
    requireAuth: async (c: any, next: any) => {
      if (!mockUser) throw new UnauthorizedError();
      c.set("user", mockUser);
      c.set("session", mockSession);
      await next();
    },
  }));

  vi.doMock("../../src/middleware/require-role.js", () => ({
    requireRole:
      (...requiredRoles: string[]) =>
      async (c: any, next: any) => {
        if (!requiredRoles.some((r) => mockRoles.includes(r))) {
          throw new ForbiddenError("Insufficient permissions");
        }
        c.set("roles", mockRoles);
        await next();
      },
  }));

  const { adminRoutes } = await import("../../src/routes/admin.routes.js");
  const { errorHandler } = await import("../../src/middleware/error-handler.js");
  const { corsMiddleware } = await import("../../src/middleware/cors.js");

  const app = new Hono();
  app.use("*", corsMiddleware);
  app.onError(errorHandler);
  app.route("/api/admin", adminRoutes);

  return app;
};

// ── Helpers ──

function setupSelectChain(results: unknown[]) {
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockImplementation(() => {
    const result = Promise.resolve(results);
    (result as any).where = mockSelectWhere;
    (result as any).orderBy = vi.fn().mockImplementation(() => {
      const orderResult = { limit: vi.fn().mockResolvedValue(results) };
      return orderResult;
    });
    return result;
  });
  mockSelectWhere.mockImplementation(() => {
    const result = Promise.resolve(results);
    (result as any).orderBy = vi.fn().mockImplementation(() => {
      const orderResult = { limit: vi.fn().mockResolvedValue(results) };
      return orderResult;
    });
    return result;
  });
}

function setupInsertChain() {
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({
    onConflictDoNothing: mockInsertOnConflictDoNothing,
  });
  mockInsertOnConflictDoNothing.mockResolvedValue(undefined);
}

function setupDeleteChain() {
  mockDelete.mockReturnValue({ where: mockDeleteWhere });
  // Needs to be called as mockDeleteFrom for the from() pattern
  // but admin routes use db.delete(table).where(...) directly
  mockDeleteWhere.mockResolvedValue(undefined);
}

// ── Tests ──

describe("admin routes", () => {
  let app: Hono;

  beforeEach(async () => {
    vi.resetAllMocks();

    mockUser = makeMockUser({ id: "admin_user_001" });
    mockSession = makeMockSession({ userId: "admin_user_001" });
    mockRoles = ["admin"];

    setupInsertChain();
    setupDeleteChain();

    app = await setupAdminApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // ── GET /api/admin/users ──

  describe("GET /api/admin/users", () => {
    it("returns paginated user list with roles", async () => {
      const dbUser = makeMockDbUser();

      // First call: select users with orderBy/limit
      mockSelect.mockReturnValue({ from: mockSelectFrom });
      mockSelectFrom.mockImplementation(() => {
        const chain: any = {
          where: vi.fn().mockImplementation(() => chain),
          orderBy: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([dbUser]),
          })),
        };
        return chain;
      });

      // Second call (roles query): select roles where userId
      const originalSelect = mockSelect;
      let callCount = 0;
      originalSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Users query
          return {
            from: () => {
              const chain: any = {
                where: vi.fn().mockImplementation(() => chain),
                orderBy: vi.fn().mockImplementation(() => ({
                  limit: vi.fn().mockResolvedValue([dbUser]),
                })),
              };
              return chain;
            },
          };
        }
        // Roles query
        return {
          from: () => ({
            where: vi.fn().mockResolvedValue([{ role: "subscriber" }]),
          }),
        };
      });

      const res = await app.request("/api/admin/users?limit=20");
      const body = (await res.json()) as {
        items: unknown[];
        nextCursor: string | null;
      };

      expect(res.status).toBe(200);
      expect(body.items).toHaveLength(1);
      expect(body.nextCursor).toBeNull();
    });

    it("returns empty list when no users", async () => {
      mockSelect.mockReturnValue({ from: mockSelectFrom });
      mockSelectFrom.mockImplementation(() => {
        const chain: any = {
          where: vi.fn().mockImplementation(() => chain),
          orderBy: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        };
        return chain;
      });

      const res = await app.request("/api/admin/users");
      const body = (await res.json()) as {
        items: unknown[];
        nextCursor: string | null;
      };

      expect(res.status).toBe(200);
      expect(body.items).toHaveLength(0);
      expect(body.nextCursor).toBeNull();
    });

    it("returns 403 for non-admin user", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/admin/users");

      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/admin/users");

      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/admin/users/:userId/roles ──

  describe("POST /api/admin/users/:userId/roles", () => {
    it("assigns role to user", async () => {
      const targetUser = makeMockDbUser();

      let callCount = 0;
      mockSelect.mockImplementation(() => ({
        from: () => ({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= 1) {
              // User exists check
              return Promise.resolve([targetUser]);
            }
            // getUserWithRoles user query
            if (callCount === 2) {
              return Promise.resolve([targetUser]);
            }
            // getUserWithRoles roles query
            return Promise.resolve([
              { role: "subscriber" },
              { role: "creator" },
            ]);
          }),
        }),
      }));

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("returns 404 when user does not exist", async () => {
      mockSelect.mockReturnValue({
        from: () => ({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const res = await app.request("/api/admin/users/nonexistent/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid role", async () => {
      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "superadmin" }),
      });

      expect(res.status).toBe(400);
    });

    it("is idempotent when role already exists", async () => {
      const targetUser = makeMockDbUser();

      let callCount = 0;
      mockSelect.mockImplementation(() => ({
        from: () => ({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= 2) return Promise.resolve([targetUser]);
            return Promise.resolve([{ role: "subscriber" }]);
          }),
        }),
      }));

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "subscriber" }),
      });

      expect(res.status).toBe(200);
      expect(mockInsertOnConflictDoNothing).toHaveBeenCalled();
    });

    it("returns 403 for non-admin user", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ── DELETE /api/admin/users/:userId/roles ──

  describe("DELETE /api/admin/users/:userId/roles", () => {
    it("revokes role from user", async () => {
      const targetUser = makeMockDbUser();

      let callCount = 0;
      mockSelect.mockImplementation(() => ({
        from: () => ({
          where: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= 2) return Promise.resolve([targetUser]);
            return Promise.resolve([{ role: "subscriber" }]);
          }),
        }),
      }));

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(200);
      expect(mockDelete).toHaveBeenCalled();
    });

    it("prevents removing own admin role", async () => {
      const res = await app.request(
        "/api/admin/users/admin_user_001/roles",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "admin" }),
        },
      );

      expect(res.status).toBe(403);
      const body = (await res.json()) as { error: { message: string } };
      expect(body.error.message).toContain("own admin role");
    });

    it("returns 404 when user does not exist", async () => {
      mockSelect.mockReturnValue({
        from: () => ({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const res = await app.request("/api/admin/users/nonexistent/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid role", async () => {
      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "superadmin" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 403 for non-admin user", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/admin/users/user_target_001/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "creator" }),
      });

      expect(res.status).toBe(401);
    });
  });
});
