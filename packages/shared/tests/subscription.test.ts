import { describe, it, expect } from "vitest";

import {
  PLAN_TYPES,
  PLAN_INTERVALS,
  SUBSCRIPTION_STATUSES,
  PlanTypeSchema,
  PlanIntervalSchema,
  SubscriptionStatusSchema,
  SubscriptionPlanSchema,
  PlansQuerySchema,
  PlansResponseSchema,
  CheckoutRequestSchema,
  CheckoutResponseSchema,
  CancelRequestSchema,
  UserSubscriptionSchema,
  UserSubscriptionWithPlanSchema,
  MySubscriptionsResponseSchema,
  type PlanType,
  type PlanInterval,
  type SubscriptionStatus,
  type SubscriptionPlan,
  type PlansQuery,
  type PlansResponse,
  type CheckoutRequest,
  type CheckoutResponse,
  type CancelRequest,
  type UserSubscription,
  type UserSubscriptionWithPlan,
  type MySubscriptionsResponse,
} from "../src/index.js";

// ── Test Fixtures ──

const VALID_PLAN = {
  id: "plan_abc123",
  name: "Platform Monthly",
  type: "platform" as const,
  creatorId: null,
  price: 999,
  interval: "month" as const,
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const VALID_CREATOR_PLAN = {
  ...VALID_PLAN,
  id: "plan_creator1",
  name: "Creator Tier",
  type: "creator" as const,
  creatorId: "user_creator1",
  price: 499,
};

const VALID_SUBSCRIPTION = {
  id: "sub_xyz789",
  userId: "user_abc123",
  planId: "plan_abc123",
  status: "active" as const,
  currentPeriodEnd: "2026-02-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// ── Tests ──

describe("PLAN_TYPES", () => {
  it("contains exactly the two expected plan types", () => {
    expect(PLAN_TYPES).toContain("platform");
    expect(PLAN_TYPES).toContain("creator");
  });

  it("has length 2", () => {
    expect(PLAN_TYPES).toHaveLength(2);
  });
});

describe("PLAN_INTERVALS", () => {
  it("contains exactly the two expected intervals", () => {
    expect(PLAN_INTERVALS).toContain("month");
    expect(PLAN_INTERVALS).toContain("year");
  });

  it("has length 2", () => {
    expect(PLAN_INTERVALS).toHaveLength(2);
  });
});

describe("SUBSCRIPTION_STATUSES", () => {
  it("contains exactly the four expected statuses", () => {
    expect(SUBSCRIPTION_STATUSES).toContain("active");
    expect(SUBSCRIPTION_STATUSES).toContain("canceled");
    expect(SUBSCRIPTION_STATUSES).toContain("past_due");
    expect(SUBSCRIPTION_STATUSES).toContain("incomplete");
  });

  it("has length 4", () => {
    expect(SUBSCRIPTION_STATUSES).toHaveLength(4);
  });
});

describe("PlanTypeSchema", () => {
  it.each(["platform", "creator"])('accepts "%s"', (value) => {
    expect(PlanTypeSchema.parse(value)).toBe(value);
  });

  it('rejects "free"', () => {
    expect(() => PlanTypeSchema.parse("free")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => PlanTypeSchema.parse("")).toThrow();
  });
});

describe("PlanIntervalSchema", () => {
  it.each(["month", "year"])('accepts "%s"', (value) => {
    expect(PlanIntervalSchema.parse(value)).toBe(value);
  });

  it('rejects "week"', () => {
    expect(() => PlanIntervalSchema.parse("week")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => PlanIntervalSchema.parse("")).toThrow();
  });
});

describe("SubscriptionStatusSchema", () => {
  it.each(["active", "canceled", "past_due", "incomplete"])(
    'accepts "%s"',
    (value) => {
      expect(SubscriptionStatusSchema.parse(value)).toBe(value);
    },
  );

  it('rejects "expired"', () => {
    expect(() => SubscriptionStatusSchema.parse("expired")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => SubscriptionStatusSchema.parse("")).toThrow();
  });
});

describe("SubscriptionPlanSchema", () => {
  it("validates a complete platform plan", () => {
    const result = SubscriptionPlanSchema.parse(VALID_PLAN);
    expect(result.id).toBe(VALID_PLAN.id);
    expect(result.type).toBe("platform");
    expect(result.creatorId).toBeNull();
    expect(result.price).toBe(999);
  });

  it("validates a complete creator plan with creatorId", () => {
    const result = SubscriptionPlanSchema.parse(VALID_CREATOR_PLAN);
    expect(result.type).toBe("creator");
    expect(result.creatorId).toBe("user_creator1");
    expect(result.price).toBe(499);
  });

  it("accepts null creatorId for platform plans", () => {
    const result = SubscriptionPlanSchema.parse({
      ...VALID_PLAN,
      creatorId: null,
    });
    expect(result.creatorId).toBeNull();
  });

  it("accepts price of 0 (free plan)", () => {
    const result = SubscriptionPlanSchema.parse({ ...VALID_PLAN, price: 0 });
    expect(result.price).toBe(0);
  });

  it("rejects negative price", () => {
    expect(() =>
      SubscriptionPlanSchema.parse({ ...VALID_PLAN, price: -1 }),
    ).toThrow();
  });

  it("rejects non-integer price", () => {
    expect(() =>
      SubscriptionPlanSchema.parse({ ...VALID_PLAN, price: 9.99 }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => SubscriptionPlanSchema.parse({})).toThrow();
  });

  it("rejects invalid type", () => {
    expect(() =>
      SubscriptionPlanSchema.parse({ ...VALID_PLAN, type: "free" }),
    ).toThrow();
  });

  it("rejects invalid interval", () => {
    expect(() =>
      SubscriptionPlanSchema.parse({ ...VALID_PLAN, interval: "week" }),
    ).toThrow();
  });
});

describe("PlansQuerySchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = PlansQuerySchema.parse({});
    expect(result).toStrictEqual({});
  });

  it('accepts { type: "platform" }', () => {
    const result = PlansQuerySchema.parse({ type: "platform" });
    expect(result.type).toBe("platform");
  });

  it('accepts { creatorId: "user_123" }', () => {
    const result = PlansQuerySchema.parse({ creatorId: "user_123" });
    expect(result.creatorId).toBe("user_123");
  });

  it("accepts both type and creatorId", () => {
    const result = PlansQuerySchema.parse({
      type: "creator",
      creatorId: "user_123",
    });
    expect(result.type).toBe("creator");
    expect(result.creatorId).toBe("user_123");
  });

  it("rejects invalid type value", () => {
    expect(() => PlansQuerySchema.parse({ type: "free" })).toThrow();
  });
});

describe("PlansResponseSchema", () => {
  it("accepts { plans: [] } (empty array)", () => {
    const result = PlansResponseSchema.parse({ plans: [] });
    expect(result.plans).toHaveLength(0);
  });

  it("accepts { plans: [validPlan] }", () => {
    const result = PlansResponseSchema.parse({ plans: [VALID_PLAN] });
    expect(result.plans).toHaveLength(1);
    expect(result.plans[0]!.id).toBe(VALID_PLAN.id);
  });

  it("rejects missing plans field", () => {
    expect(() => PlansResponseSchema.parse({})).toThrow();
  });
});

describe("CheckoutRequestSchema", () => {
  it("accepts a valid planId", () => {
    const result = CheckoutRequestSchema.parse({ planId: "plan_abc" });
    expect(result.planId).toBe("plan_abc");
  });

  it("rejects empty string planId", () => {
    expect(() => CheckoutRequestSchema.parse({ planId: "" })).toThrow();
  });

  it("rejects missing planId", () => {
    expect(() => CheckoutRequestSchema.parse({})).toThrow();
  });
});

describe("CheckoutResponseSchema", () => {
  it("accepts a valid checkout URL", () => {
    const result = CheckoutResponseSchema.parse({
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
    });
    expect(result.checkoutUrl).toBe(
      "https://checkout.stripe.com/pay/cs_test_123",
    );
  });

  it("rejects non-URL string", () => {
    expect(() =>
      CheckoutResponseSchema.parse({ checkoutUrl: "not-a-url" }),
    ).toThrow();
  });

  it("rejects missing checkoutUrl", () => {
    expect(() => CheckoutResponseSchema.parse({})).toThrow();
  });
});

describe("CancelRequestSchema", () => {
  it("accepts a valid subscriptionId", () => {
    const result = CancelRequestSchema.parse({ subscriptionId: "sub_abc" });
    expect(result.subscriptionId).toBe("sub_abc");
  });

  it("rejects empty string subscriptionId", () => {
    expect(() => CancelRequestSchema.parse({ subscriptionId: "" })).toThrow();
  });

  it("rejects missing subscriptionId", () => {
    expect(() => CancelRequestSchema.parse({})).toThrow();
  });
});

describe("UserSubscriptionSchema", () => {
  it("validates a complete subscription object", () => {
    const result = UserSubscriptionSchema.parse(VALID_SUBSCRIPTION);
    expect(result.id).toBe(VALID_SUBSCRIPTION.id);
    expect(result.userId).toBe(VALID_SUBSCRIPTION.userId);
    expect(result.status).toBe("active");
    expect(result.cancelAtPeriodEnd).toBe(false);
  });

  it("accepts null currentPeriodEnd", () => {
    const result = UserSubscriptionSchema.parse({
      ...VALID_SUBSCRIPTION,
      currentPeriodEnd: null,
    });
    expect(result.currentPeriodEnd).toBeNull();
  });

  it("accepts cancelAtPeriodEnd true", () => {
    const result = UserSubscriptionSchema.parse({
      ...VALID_SUBSCRIPTION,
      cancelAtPeriodEnd: true,
    });
    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(() =>
      UserSubscriptionSchema.parse({
        ...VALID_SUBSCRIPTION,
        status: "expired",
      }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => UserSubscriptionSchema.parse({})).toThrow();
  });
});

describe("UserSubscriptionWithPlanSchema", () => {
  it("validates subscription with nested plan", () => {
    const result = UserSubscriptionWithPlanSchema.parse({
      ...VALID_SUBSCRIPTION,
      plan: VALID_PLAN,
    });
    expect(result.id).toBe(VALID_SUBSCRIPTION.id);
    expect(result.plan.id).toBe(VALID_PLAN.id);
    expect(result.plan.type).toBe("platform");
  });

  it("rejects missing plan field", () => {
    expect(() =>
      UserSubscriptionWithPlanSchema.parse(VALID_SUBSCRIPTION),
    ).toThrow();
  });

  it("rejects invalid nested plan object", () => {
    expect(() =>
      UserSubscriptionWithPlanSchema.parse({
        ...VALID_SUBSCRIPTION,
        plan: { id: "bad_plan" },
      }),
    ).toThrow();
  });
});

describe("MySubscriptionsResponseSchema", () => {
  it("accepts { subscriptions: [] } (empty array)", () => {
    const result = MySubscriptionsResponseSchema.parse({ subscriptions: [] });
    expect(result.subscriptions).toHaveLength(0);
  });

  it("accepts { subscriptions: [validSubWithPlan] }", () => {
    const result = MySubscriptionsResponseSchema.parse({
      subscriptions: [{ ...VALID_SUBSCRIPTION, plan: VALID_PLAN }],
    });
    expect(result.subscriptions).toHaveLength(1);
    expect(result.subscriptions[0]!.plan.id).toBe(VALID_PLAN.id);
  });

  it("accepts multiple subscriptions", () => {
    const sub2 = {
      ...VALID_SUBSCRIPTION,
      id: "sub_456",
      plan: VALID_CREATOR_PLAN,
    };
    const result = MySubscriptionsResponseSchema.parse({
      subscriptions: [{ ...VALID_SUBSCRIPTION, plan: VALID_PLAN }, sub2],
    });
    expect(result.subscriptions).toHaveLength(2);
    expect(result.subscriptions[1]!.id).toBe("sub_456");
  });

  it("rejects missing subscriptions field", () => {
    expect(() => MySubscriptionsResponseSchema.parse({})).toThrow();
  });
});

// ── Type-level assertions (compile-time only) ──

const _planTypeCheck: PlanType = "platform";
const _planIntervalCheck: PlanInterval = "month";
const _statusCheck: SubscriptionStatus = "active";
const _planCheck: SubscriptionPlan = VALID_PLAN;
const _queryCheck: PlansQuery = {};
const _plansResponseCheck: PlansResponse = { plans: [] };
const _checkoutRequestCheck: CheckoutRequest = { planId: "plan_abc" };
const _checkoutResponseCheck: CheckoutResponse = {
  checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
};
const _cancelRequestCheck: CancelRequest = { subscriptionId: "sub_abc" };
const _subscriptionCheck: UserSubscription = VALID_SUBSCRIPTION;
const _subWithPlanCheck: UserSubscriptionWithPlan = {
  ...VALID_SUBSCRIPTION,
  plan: VALID_PLAN,
};
const _mySubsCheck: MySubscriptionsResponse = { subscriptions: [] };
