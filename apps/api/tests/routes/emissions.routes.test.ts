import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { User, Session } from "@snc/shared";

import { TEST_CONFIG } from "../helpers/test-constants.js";
import { makeMockUser, makeMockSession } from "../helpers/auth-fixtures.js";
import { makeMockEmissionRow } from "../helpers/emissions-fixtures.js";

// ── Mock State ──

let mockUser: User | null;
let mockSession: Session | null;
let mockRoles: string[];

// ── Mock DB Chains ──

const mockSelectWhere = vi.fn();
const mockSelectGroupBy = vi.fn();
const mockSelectOrderBy = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
};

// ── App Factory ──

const setupEmissionsApp = async (): Promise<Hono> => {
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

  vi.doMock("../../src/db/schema/emission.schema.js", () => ({
    emissions: {
      id: {},
      date: {},
      scope: {},
      category: {},
      subcategory: {},
      source: {},
      description: {},
      amount: {},
      unit: {},
      co2Kg: {},
      method: {},
      projected: {},
      metadata: {},
      createdAt: {},
      updatedAt: {},
    },
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

  const { emissionsRoutes } = await import(
    "../../src/routes/emissions.routes.js"
  );
  const { errorHandler } = await import(
    "../../src/middleware/error-handler.js"
  );
  const { corsMiddleware } = await import("../../src/middleware/cors.js");

  const app = new Hono();
  app.use("*", corsMiddleware);
  app.onError(errorHandler);
  app.route("/api/emissions", emissionsRoutes);

  return app;
};

// ── Tests ──

describe("emissions routes", () => {
  let app: Hono;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Re-establish SELECT chain after resetAllMocks.
    // summary/breakdown: db.select({...}).from(emissions).where(...)
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockImplementation(() => {
      const result = Promise.resolve([
        { co2Kg: "0", entryCount: 0, latestDate: null },
      ]);
      (result as any).where = mockSelectWhere;
      (result as any).groupBy = mockSelectGroupBy;
      (result as any).orderBy = mockSelectOrderBy;
      return result;
    });
    mockSelectWhere.mockImplementation(() => {
      const result = Promise.resolve([
        { co2Kg: "0", entryCount: 0, latestDate: null },
      ]);
      (result as any).groupBy = mockSelectGroupBy;
      (result as any).orderBy = mockSelectOrderBy;
      return result;
    });
    mockSelectGroupBy.mockImplementation(() => {
      const result = Promise.resolve([]);
      (result as any).orderBy = mockSelectOrderBy;
      return result;
    });
    mockSelectOrderBy.mockResolvedValue([]);

    // INSERT chain: db.insert(table).values({...}).onConflictDoNothing().returning()
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
    mockInsertReturning.mockResolvedValue([makeMockEmissionRow()]);

    mockUser = makeMockUser();
    mockSession = makeMockSession();
    mockRoles = ["subscriber"];

    app = await setupEmissionsApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // ── GET /api/emissions/summary ──

  describe("GET /api/emissions/summary", () => {
    it("returns emissions summary with gross/offset/net and projection fields", async () => {
      // Calls: gross (actual), projected, offset
      mockSelectWhere
        .mockResolvedValueOnce([
          { co2Kg: "0.034443", entryCount: 1, latestDate: "2026-03-31" },
        ])
        .mockResolvedValueOnce([
          { co2Kg: "0.5" },
        ])
        .mockResolvedValueOnce([
          { co2Kg: "-0.01" },
        ]);

      const res = await app.request("/api/emissions/summary");
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.grossCo2Kg).toBe(0.034443);
      expect(body.offsetCo2Kg).toBe(0.01);
      expect(body.netCo2Kg).toBeCloseTo(0.024443);
      expect(body.entryCount).toBe(1);
      expect(body.latestDate).toBe("2026-03-31");
      // Projection fields
      expect(body.projectedGrossCo2Kg).toBeCloseTo(0.534443);
      expect(body.doubleOffsetTargetCo2Kg).toBeCloseTo(1.068886);
      expect(body.additionalOffsetCo2Kg).toBeCloseTo(1.058886);
    });

    it("returns zeros when no entries", async () => {
      const res = await app.request("/api/emissions/summary");
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.grossCo2Kg).toBe(0);
      expect(body.offsetCo2Kg).toBe(0);
      expect(body.netCo2Kg).toBe(0);
      expect(body.entryCount).toBe(0);
      expect(body.latestDate).toBeNull();
      expect(body.projectedGrossCo2Kg).toBe(0);
      expect(body.doubleOffsetTargetCo2Kg).toBe(0);
      expect(body.additionalOffsetCo2Kg).toBe(0);
    });

    it("returns 200 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/emissions/summary");

      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/emissions/breakdown ──

  describe("GET /api/emissions/breakdown", () => {
    it("returns full breakdown with projection fields and split monthly data", async () => {
      const row = makeMockEmissionRow();

      // The breakdown handler calls:
      // 1. db.select().from(emissions).where(ne(scope,0) AND projected=false) → gross actual
      // 2. db.select().from(emissions).where(ne(scope,0) AND projected=true) → projected
      // 3. db.select().from(emissions).where(eq(scope,0)) → offset
      // 4. db.select().from(emissions).groupBy() → byScope
      // 5. db.select().from(emissions).groupBy() → byCategory
      // 6. db.select().from(emissions).groupBy().orderBy() → monthly
      // 7. db.select().from(emissions).orderBy() → entries

      mockSelectFrom
        // Gross actual query
        .mockImplementationOnce(() => ({
          where: () => Promise.resolve([
            { co2Kg: "0.034443", entryCount: 1, latestDate: "2026-03-31" },
          ]),
        }))
        // Projected query
        .mockImplementationOnce(() => ({
          where: () => Promise.resolve([
            { co2Kg: "0.5" },
          ]),
        }))
        // Offset query
        .mockImplementationOnce(() => ({
          where: () => Promise.resolve([
            { co2Kg: "-0.01" },
          ]),
        }))
        // By scope query
        .mockImplementationOnce(() => ({
          where: () => ({
            groupBy: () =>
              Promise.resolve([
                { scope: 2, co2Kg: "0.034443" },
              ]),
          }),
        }))
        // By category query
        .mockImplementationOnce(() => ({
          where: () => ({
            groupBy: () =>
              Promise.resolve([
                { category: "cloud-compute", co2Kg: "0.034443" },
              ]),
          }),
        }))
        // Monthly query
        .mockImplementationOnce(() => ({
          groupBy: () => ({
            orderBy: () =>
              Promise.resolve([
                { month: "2026-03", actualCo2Kg: "0.034443", projectedCo2Kg: "0", offsetCo2Kg: "0.01" },
              ]),
          }),
        }))
        // Entries query
        .mockImplementationOnce(() => ({
          orderBy: () => Promise.resolve([row]),
        }));

      const res = await app.request("/api/emissions/breakdown");
      const body = await res.json() as Record<string, any>;

      expect(res.status).toBe(200);
      expect(body.summary.grossCo2Kg).toBe(0.034443);
      expect(body.summary.offsetCo2Kg).toBe(0.01);
      expect(body.summary.netCo2Kg).toBeCloseTo(0.024443);
      expect(body.summary.projectedGrossCo2Kg).toBeCloseTo(0.534443);
      expect(body.summary.doubleOffsetTargetCo2Kg).toBeCloseTo(1.068886);
      expect(body.byScope).toHaveLength(1);
      expect(body.byCategory).toHaveLength(1);
      expect(body.monthly).toHaveLength(1);
      expect(body.monthly[0].actualCo2Kg).toBe(0.034443);
      expect(body.monthly[0].projectedCo2Kg).toBe(0);
      expect(body.monthly[0].offsetCo2Kg).toBe(0.01);
      expect(body.entries).toHaveLength(1);
      expect(body.entries[0].projected).toBe(false);
      expect(body.entries[0].createdAt).toBe("2026-03-31T00:00:00.000Z");
    });

    it("returns 200 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/emissions/breakdown");
      const body = await res.json() as Record<string, any>;

      expect(res.status).toBe(200);
      expect(body.entries).toBeDefined();
    });

    it("strips sessionDates from entry metadata", async () => {
      const row = makeMockEmissionRow({
        metadata: {
          inputTokens: 100,
          sessionDates: ["2026-03-01", "2026-03-02"],
        },
      });

      mockSelectFrom
        .mockImplementationOnce(() => ({
          where: () => Promise.resolve([
            { co2Kg: "0.01", entryCount: 1, latestDate: "2026-03-31" },
          ]),
        }))
        .mockImplementationOnce(() => ({
          where: () => Promise.resolve([{ co2Kg: "0" }]),
        }))
        .mockImplementationOnce(() => ({
          where: () => Promise.resolve([{ co2Kg: "0" }]),
        }))
        .mockImplementationOnce(() => ({
          where: () => ({
            groupBy: () => Promise.resolve([]),
          }),
        }))
        .mockImplementationOnce(() => ({
          where: () => ({
            groupBy: () => Promise.resolve([]),
          }),
        }))
        .mockImplementationOnce(() => ({
          groupBy: () => ({
            orderBy: () => Promise.resolve([]),
          }),
        }))
        .mockImplementationOnce(() => ({
          orderBy: () => Promise.resolve([row]),
        }));

      const res = await app.request("/api/emissions/breakdown");
      const body = await res.json() as Record<string, any>;

      expect(res.status).toBe(200);
      expect(body.entries).toHaveLength(1);
      expect(body.entries[0].metadata).toEqual({ inputTokens: 100 });
      expect(body.entries[0].metadata.sessionDates).toBeUndefined();
    });
  });

  // ── POST /api/emissions/entries ──

  describe("POST /api/emissions/entries", () => {
    const validBody = {
      date: "2026-03-31",
      scope: 2,
      category: "cloud-compute",
      subcategory: "ai-development",
      source: "Claude Code",
      description: "Test entry",
      amount: 100,
      unit: "tokens",
      co2Kg: 0.001,
      method: "token-estimate",
    };

    it("creates and returns a new entry", async () => {
      mockRoles = ["admin"];

      const res = await app.request("/api/emissions/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect((body as any).id).toBeDefined();
      expect((body as any).date).toBe("2026-03-31");
      expect((body as any).projected).toBe(false);
    });

    it("creates a projected entry when projected=true", async () => {
      mockRoles = ["admin"];
      const projectedRow = makeMockEmissionRow({ projected: true });
      mockInsertReturning.mockResolvedValue([projectedRow]);

      const res = await app.request("/api/emissions/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validBody, projected: true }),
      });
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.projected).toBe(true);
    });

    it("returns 400 for invalid body", async () => {
      mockRoles = ["admin"];

      const res = await app.request("/api/emissions/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: "bad" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/emissions/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/emissions/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      expect(res.status).toBe(403);
    });
  });

  // ── POST /api/emissions/offsets ──

  describe("POST /api/emissions/offsets", () => {
    const validOffset = {
      date: "2026-03-31",
      source: "Gold Standard VER",
      description: "Voluntary carbon offset",
      amount: 1,
      unit: "credits",
      co2Kg: 10,
      method: "verified-offset",
    };

    it("creates an offset entry with scope 0 and negative co2Kg", async () => {
      mockRoles = ["admin"];
      const offsetRow = makeMockEmissionRow({
        scope: 0,
        category: "offset",
        co2Kg: -10,
      });
      mockInsertReturning.mockResolvedValue([offsetRow]);

      const res = await app.request("/api/emissions/offsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOffset),
      });
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.scope).toBe(0);
      expect(body.co2Kg).toBe(-10);
    });

    it("returns 400 for invalid body", async () => {
      mockRoles = ["admin"];

      const res = await app.request("/api/emissions/offsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: "bad" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 401 for unauthenticated request", async () => {
      mockUser = null;

      const res = await app.request("/api/emissions/offsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOffset),
      });

      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin", async () => {
      mockRoles = ["subscriber"];

      const res = await app.request("/api/emissions/offsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOffset),
      });

      expect(res.status).toBe(403);
    });
  });
});
