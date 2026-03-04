import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { TEST_CONFIG } from "../helpers/test-constants.js";

// ── Mock State ──

// SELECT chain: db.select().from().innerJoin().where().limit()
const mockLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockLimit }));
const mockInnerJoin = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelectFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

const mockDb = {
  select: mockSelect,
};

// ── Test App Factory ──

const setupContentGate = async () => {
  vi.doMock("../../src/config.js", () => ({
    config: TEST_CONFIG,
  }));

  vi.doMock("../../src/db/connection.js", () => ({
    db: mockDb,
    sql: vi.fn(),
  }));

  vi.doMock("../../src/db/schema/subscription.schema.js", () => ({
    subscriptionPlans: {
      id: {},
      type: {},
      creatorId: {},
    },
    userSubscriptions: {
      id: {},
      userId: {},
      planId: {},
      status: {},
      currentPeriodEnd: {},
    },
  }));

  return await import("../../src/middleware/content-gate.js");
};

// ── Tests ──

describe("checkContentAccess", () => {
  let checkContentAccess: (
    userId: string | null,
    contentCreatorId: string,
    contentVisibility: string,
  ) => Promise<{ allowed: boolean; reason?: string; creatorId?: string }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default: no matching subscriptions found
    mockLimit.mockResolvedValue([]);
    const module = await setupContentGate();
    checkContentAccess = module.checkContentAccess;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe("public content", () => {
    it("returns allowed for public visibility without querying DB", async () => {
      const result = await checkContentAccess("user_123", "creator_456", "public");

      expect(result).toEqual({ allowed: true });
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe("unauthenticated access", () => {
    it("returns not allowed with AUTHENTICATION_REQUIRED for null userId", async () => {
      const result = await checkContentAccess(null, "creator_456", "subscribers");

      expect(result).toEqual({
        allowed: false,
        reason: "AUTHENTICATION_REQUIRED",
        creatorId: "creator_456",
      });
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe("owner bypass", () => {
    it("returns allowed when userId equals contentCreatorId", async () => {
      const result = await checkContentAccess("creator_456", "creator_456", "subscribers");

      expect(result).toEqual({ allowed: true });
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe("active platform subscription", () => {
    it("returns allowed when user has active platform subscription", async () => {
      mockLimit.mockResolvedValue([{ id: "sub_123" }]);

      const result = await checkContentAccess("user_123", "creator_456", "subscribers");

      expect(result).toEqual({ allowed: true });
      expect(mockSelect).toHaveBeenCalledOnce();
    });
  });

  describe("active per-creator subscription", () => {
    it("returns allowed when user has active subscription for matching creator", async () => {
      mockLimit.mockResolvedValue([{ id: "sub_123" }]);

      const result = await checkContentAccess("user_123", "creator_456", "subscribers");

      expect(result).toEqual({ allowed: true });
    });

    it("returns not allowed when user has active subscription for different creator", async () => {
      mockLimit.mockResolvedValue([]);

      const result = await checkContentAccess("user_123", "creator_other", "subscribers");

      expect(result).toEqual({
        allowed: false,
        reason: "SUBSCRIPTION_REQUIRED",
        creatorId: "creator_other",
      });
    });
  });

  describe("canceled subscription", () => {
    it("returns allowed when canceled but currentPeriodEnd is in the future", async () => {
      // DB query includes canceled + future period in WHERE clause; if it
      // matches, the mock returns a row indicating access is granted
      mockLimit.mockResolvedValue([{ id: "sub_123" }]);

      const result = await checkContentAccess("user_123", "creator_456", "subscribers");

      expect(result).toEqual({ allowed: true });
    });

    it("returns not allowed when canceled and currentPeriodEnd is in the past", async () => {
      // DB query excludes expired canceled subscriptions; mock returns empty
      mockLimit.mockResolvedValue([]);

      const result = await checkContentAccess("user_123", "creator_456", "subscribers");

      expect(result).toEqual({
        allowed: false,
        reason: "SUBSCRIPTION_REQUIRED",
        creatorId: "creator_456",
      });
    });
  });

  describe("past_due subscription", () => {
    it("returns not allowed when subscription is past_due", async () => {
      // past_due is excluded from the query's status filter; mock returns empty
      mockLimit.mockResolvedValue([]);

      const result = await checkContentAccess("user_123", "creator_456", "subscribers");

      expect(result).toEqual({
        allowed: false,
        reason: "SUBSCRIPTION_REQUIRED",
        creatorId: "creator_456",
      });
    });
  });

  describe("no subscription", () => {
    it("returns not allowed when user has no subscriptions", async () => {
      mockLimit.mockResolvedValue([]);

      const result = await checkContentAccess("user_123", "creator_456", "subscribers");

      expect(result).toEqual({
        allowed: false,
        reason: "SUBSCRIPTION_REQUIRED",
        creatorId: "creator_456",
      });
    });
  });
});
