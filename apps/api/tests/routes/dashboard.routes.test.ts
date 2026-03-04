import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { User, Session } from "@snc/shared";

import { TEST_CONFIG } from "../helpers/test-constants.js";
import { makeMockUser, makeMockSession } from "../helpers/auth-fixtures.js";
import { makeMockMonthlyRevenue } from "../helpers/dashboard-fixtures.js";

// ── Mock State ──

let mockUser: User | null;
let mockSession: Session | null;
let mockRoles: string[];

// ── Mock Revenue Service ──

const mockGetMonthlyRevenue = vi.fn();

// ── Mock DB Chains ──

// COUNT queries: db.select({ count: count() }).from(table).where(...)
// The dashboard routes use only COUNT(*) queries — no JOIN chains needed.
//
// SELECT chain: .select(...).from(table).where(...)
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn();

const mockDb = {
  select: mockSelect,
};

// ── App Factory ──

const setupDashboardApp = async (): Promise<Hono> => {
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

  vi.doMock("../../src/db/schema/subscription.schema.js", () => ({
    userSubscriptions: {
      id: {},
      userId: {},
      planId: {},
      stripeSubscriptionId: {},
      stripeCustomerId: {},
      status: {},
      currentPeriodEnd: {},
      cancelAtPeriodEnd: {},
      createdAt: {},
      updatedAt: {},
    },
    subscriptionPlans: {},
    paymentEvents: {},
  }));

  vi.doMock("../../src/db/schema/booking.schema.js", () => ({
    services: {},
    bookingRequests: {
      id: {},
      userId: {},
      serviceId: {},
      preferredDates: {},
      notes: {},
      status: {},
      reviewedBy: {},
      reviewNote: {},
      createdAt: {},
      updatedAt: {},
    },
  }));

  vi.doMock("../../src/services/revenue.js", () => ({
    getMonthlyRevenue: mockGetMonthlyRevenue,
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

  const { dashboardRoutes } = await import(
    "../../src/routes/dashboard.routes.js"
  );
  const { errorHandler } = await import(
    "../../src/middleware/error-handler.js"
  );
  const { corsMiddleware } = await import("../../src/middleware/cors.js");

  const app = new Hono();
  app.use("*", corsMiddleware);
  app.onError(errorHandler);
  app.route("/api/dashboard", dashboardRoutes);

  return app;
};

// ── Tests ──

describe("dashboard routes", () => {
  let app: Hono;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Re-establish SELECT chain after resetAllMocks.
    // .from() must be both terminal (await-able) AND have a .where method,
    // because some queries end at .from() (total count) and others chain .where() (pending/active).
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockImplementation(() => {
      const result = Promise.resolve([{ count: 0 }]);
      (result as any).where = mockSelectWhere;
      return result;
    });
    mockSelectWhere.mockResolvedValue([{ count: 0 }]);

    mockUser = makeMockUser();
    mockSession = makeMockSession();
    mockRoles = ["cooperative-member"];

    // Default: revenue service returns empty 12-month array
    mockGetMonthlyRevenue.mockResolvedValue({
      ok: true,
      value: [],
    });

    app = await setupDashboardApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // ── GET /api/dashboard/revenue ──

  describe("GET /api/dashboard/revenue", () => {
    it("returns current month total and monthly breakdown", async () => {
      const now = new Date();
      const currentMonth = now.getUTCMonth() + 1;
      const currentYear = now.getUTCFullYear();
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const monthly = [
        makeMockMonthlyRevenue({
          month: currentMonth,
          year: currentYear,
          amount: 7500,
        }),
        makeMockMonthlyRevenue({
          month: prevMonth,
          year: prevYear,
          amount: 5000,
        }),
      ];

      mockGetMonthlyRevenue.mockResolvedValue({ ok: true, value: monthly });

      const res = await app.request("/api/dashboard/revenue");
      const body = (await res.json()) as {
        currentMonth: number;
        monthly: unknown[];
      };

      expect(res.status).toBe(200);
      expect(body.currentMonth).toBe(7500);
      expect(body.monthly).toHaveLength(2);
      expect(mockGetMonthlyRevenue).toHaveBeenCalledWith(12);
    });

    it("returns currentMonth as 0 when current month has no revenue", async () => {
      // Return months that do NOT include the current month
      const monthly = [
        makeMockMonthlyRevenue({ month: 1, year: 2025, amount: 3000 }),
        makeMockMonthlyRevenue({ month: 2, year: 2025, amount: 4000 }),
      ];

      mockGetMonthlyRevenue.mockResolvedValue({ ok: true, value: monthly });

      const res = await app.request("/api/dashboard/revenue");
      const body = (await res.json()) as {
        currentMonth: number;
        monthly: unknown[];
      };

      expect(res.status).toBe(200);
      expect(body.currentMonth).toBe(0);
      expect(body.monthly).toHaveLength(2);
    });

    it("returns 502 when revenue service fails", async () => {
      const { AppError } = await import("@snc/shared");
      mockGetMonthlyRevenue.mockResolvedValue({
        ok: false,
        error: new AppError("REVENUE_ERROR", "Stripe API failure", 502),
      });

      const res = await app.request("/api/dashboard/revenue");
      const body = (await res.json()) as { error: { code: string } };

      expect(res.status).toBe(502);
      expect(body.error.code).toBe("REVENUE_ERROR");
    });

    it("returns 403 for non-cooperative-member", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/dashboard/revenue");

      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/dashboard/revenue");

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/dashboard/subscribers ──

  describe("GET /api/dashboard/subscribers", () => {
    it("returns active subscriber count", async () => {
      mockSelectWhere.mockResolvedValue([{ count: 42 }]);

      const res = await app.request("/api/dashboard/subscribers");
      const body = (await res.json()) as { active: number };

      expect(res.status).toBe(200);
      expect(body.active).toBe(42);
    });

    it("returns { active: 0 } when no active subscribers", async () => {
      // Default mock already returns [{ count: 0 }]
      const res = await app.request("/api/dashboard/subscribers");
      const body = (await res.json()) as { active: number };

      expect(res.status).toBe(200);
      expect(body.active).toBe(0);
    });

    it("returns 403 for non-cooperative-member", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/dashboard/subscribers");

      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/dashboard/subscribers");

      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/dashboard/bookings ──

  describe("GET /api/dashboard/bookings", () => {
    it("returns pending and total booking counts", async () => {
      // First .from() call (total count) — terminal, no .where()
      // Second .from() call (pending count) — chains to .where()
      mockSelectFrom
        .mockImplementationOnce(() => {
          // Total count — terminal (no .where())
          return Promise.resolve([{ count: 10 }]);
        })
        .mockImplementationOnce(() => {
          // Pending count — chains to .where()
          return { where: mockSelectWhere };
        });
      mockSelectWhere.mockResolvedValue([{ count: 3 }]);

      const res = await app.request("/api/dashboard/bookings");
      const body = (await res.json()) as { pending: number; total: number };

      expect(res.status).toBe(200);
      expect(body.total).toBe(10);
      expect(body.pending).toBe(3);
    });

    it("returns { pending: 0, total: 0 } when no bookings", async () => {
      // Default mock returns [{ count: 0 }] for both paths
      const res = await app.request("/api/dashboard/bookings");
      const body = (await res.json()) as { pending: number; total: number };

      expect(res.status).toBe(200);
      expect(body.pending).toBe(0);
      expect(body.total).toBe(0);
    });

    it("returns 403 for non-cooperative-member", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/dashboard/bookings");

      expect(res.status).toBe(403);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/dashboard/bookings");

      expect(res.status).toBe(401);
    });
  });
});
