import { describe, it, expect } from "vitest";

import {
  MonthlyRevenueSchema,
  RevenueResponseSchema,
  SubscriberSummarySchema,
  BookingSummarySchema,
  type MonthlyRevenue,
  type RevenueResponse,
  type SubscriberSummary,
  type BookingSummary,
} from "../src/index.js";

const VALID_MONTHLY_REVENUE = {
  month: 6,
  year: 2026,
  amount: 5000,
};

const VALID_REVENUE_RESPONSE = {
  currentMonth: 5000,
  monthly: [VALID_MONTHLY_REVENUE],
};

const VALID_SUBSCRIBER_SUMMARY = {
  active: 42,
};

const VALID_BOOKING_SUMMARY = {
  pending: 3,
  total: 10,
};

describe("MonthlyRevenueSchema", () => {
  it("validates { month: 1, year: 2026, amount: 5000 }", () => {
    const result = MonthlyRevenueSchema.parse({ month: 1, year: 2026, amount: 5000 });
    expect(result.month).toBe(1);
    expect(result.year).toBe(2026);
    expect(result.amount).toBe(5000);
  });

  it("validates month at minimum boundary (1)", () => {
    const result = MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, month: 1 });
    expect(result.month).toBe(1);
  });

  it("validates month at maximum boundary (12)", () => {
    const result = MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, month: 12 });
    expect(result.month).toBe(12);
  });

  it("validates amount at zero (min 0)", () => {
    const result = MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, amount: 0 });
    expect(result.amount).toBe(0);
  });

  it("rejects month below minimum (0)", () => {
    expect(() =>
      MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, month: 0 }),
    ).toThrow();
  });

  it("rejects month above maximum (13)", () => {
    expect(() =>
      MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, month: 13 }),
    ).toThrow();
  });

  it("rejects negative amount (-1)", () => {
    expect(() =>
      MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, amount: -1 }),
    ).toThrow();
  });

  it("rejects non-integer amount (1.5)", () => {
    expect(() =>
      MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, amount: 1.5 }),
    ).toThrow();
  });

  it("rejects non-integer month (1.5)", () => {
    expect(() =>
      MonthlyRevenueSchema.parse({ ...VALID_MONTHLY_REVENUE, month: 1.5 }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => MonthlyRevenueSchema.parse({})).toThrow();
  });
});

describe("RevenueResponseSchema", () => {
  it("validates complete response with currentMonth and monthly array", () => {
    const result = RevenueResponseSchema.parse(VALID_REVENUE_RESPONSE);
    expect(result.currentMonth).toBe(5000);
    expect(result.monthly).toHaveLength(1);
    expect(result.monthly[0]!.month).toBe(6);
  });

  it("validates with empty monthly array", () => {
    const result = RevenueResponseSchema.parse({
      currentMonth: 0,
      monthly: [],
    });
    expect(result.monthly).toHaveLength(0);
  });

  it("validates with multiple monthly entries", () => {
    const result = RevenueResponseSchema.parse({
      currentMonth: 10000,
      monthly: [
        { month: 1, year: 2026, amount: 4000 },
        { month: 2, year: 2026, amount: 6000 },
      ],
    });
    expect(result.monthly).toHaveLength(2);
  });

  it("rejects negative currentMonth (-1)", () => {
    expect(() =>
      RevenueResponseSchema.parse({ ...VALID_REVENUE_RESPONSE, currentMonth: -1 }),
    ).toThrow();
  });

  it("rejects non-integer currentMonth (1.5)", () => {
    expect(() =>
      RevenueResponseSchema.parse({ ...VALID_REVENUE_RESPONSE, currentMonth: 1.5 }),
    ).toThrow();
  });

  it("rejects missing currentMonth", () => {
    expect(() =>
      RevenueResponseSchema.parse({ monthly: [] }),
    ).toThrow();
  });

  it("rejects missing monthly", () => {
    expect(() =>
      RevenueResponseSchema.parse({ currentMonth: 5000 }),
    ).toThrow();
  });

  it("rejects invalid items in monthly array", () => {
    expect(() =>
      RevenueResponseSchema.parse({
        currentMonth: 5000,
        monthly: [{ invalid: true }],
      }),
    ).toThrow();
  });
});

describe("SubscriberSummarySchema", () => {
  it("validates { active: 42 }", () => {
    const result = SubscriberSummarySchema.parse(VALID_SUBSCRIBER_SUMMARY);
    expect(result.active).toBe(42);
  });

  it("validates { active: 0 }", () => {
    const result = SubscriberSummarySchema.parse({ active: 0 });
    expect(result.active).toBe(0);
  });

  it("rejects negative active (-1)", () => {
    expect(() => SubscriberSummarySchema.parse({ active: -1 })).toThrow();
  });

  it("rejects non-integer active (1.5)", () => {
    expect(() => SubscriberSummarySchema.parse({ active: 1.5 })).toThrow();
  });

  it("rejects missing active field", () => {
    expect(() => SubscriberSummarySchema.parse({})).toThrow();
  });
});

describe("BookingSummarySchema", () => {
  it("validates { pending: 3, total: 10 }", () => {
    const result = BookingSummarySchema.parse(VALID_BOOKING_SUMMARY);
    expect(result.pending).toBe(3);
    expect(result.total).toBe(10);
  });

  it("validates { pending: 0, total: 0 }", () => {
    const result = BookingSummarySchema.parse({ pending: 0, total: 0 });
    expect(result.pending).toBe(0);
    expect(result.total).toBe(0);
  });

  it("rejects negative pending (-1)", () => {
    expect(() =>
      BookingSummarySchema.parse({ ...VALID_BOOKING_SUMMARY, pending: -1 }),
    ).toThrow();
  });

  it("rejects negative total (-1)", () => {
    expect(() =>
      BookingSummarySchema.parse({ ...VALID_BOOKING_SUMMARY, total: -1 }),
    ).toThrow();
  });

  it("rejects non-integer pending (1.5)", () => {
    expect(() =>
      BookingSummarySchema.parse({ ...VALID_BOOKING_SUMMARY, pending: 1.5 }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => BookingSummarySchema.parse({})).toThrow();
  });
});

// ── Type-level assertions (compile-time only) ──

const _monthlyRevenueCheck: MonthlyRevenue = VALID_MONTHLY_REVENUE;
const _revenueResponseCheck: RevenueResponse = VALID_REVENUE_RESPONSE;
const _subscriberSummaryCheck: SubscriberSummary = VALID_SUBSCRIBER_SUMMARY;
const _bookingSummaryCheck: BookingSummary = VALID_BOOKING_SUMMARY;
