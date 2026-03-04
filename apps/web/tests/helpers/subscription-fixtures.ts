import type { SubscriptionPlan, UserSubscriptionWithPlan } from "@snc/shared";

// ── Public API ──

export const makeMockPlan = (
  overrides?: Partial<SubscriptionPlan>,
): SubscriptionPlan => ({
  id: "plan_test_platform_monthly",
  name: "S/NC All Access",
  type: "platform",
  creatorId: null,
  price: 999,
  interval: "month",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

export const makeMockUserSubscription = (
  overrides?: Partial<UserSubscriptionWithPlan>,
): UserSubscriptionWithPlan => ({
  id: "sub_record_test_xxx",
  userId: "user-1",
  planId: "plan_test_platform_monthly",
  status: "active",
  currentPeriodEnd: "2026-03-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  plan: {
    id: "plan_test_platform_monthly",
    name: "S/NC All Access",
    type: "platform",
    creatorId: null,
    price: 999,
    interval: "month",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  ...overrides,
});
