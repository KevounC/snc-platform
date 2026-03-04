import type { MonthlyRevenue } from "@snc/shared";

// ── Private Types ──

type StripeInvoiceShape = {
  id: string;
  amount_paid: number;
  created: number;
  status: string;
};

// ── Stripe Invoice Fixtures ──

export const makeMockStripeInvoice = (
  overrides?: Partial<StripeInvoiceShape>,
): StripeInvoiceShape => ({
  id: "in_test_001",
  amount_paid: 999,
  created: Math.floor(new Date("2026-02-15T12:00:00Z").getTime() / 1000),
  status: "paid",
  ...overrides,
});

// ── Monthly Revenue Fixtures ──

export const makeMockMonthlyRevenue = (
  overrides?: Partial<MonthlyRevenue>,
): MonthlyRevenue => ({
  month: 1,
  year: 2026,
  amount: 5000,
  ...overrides,
});
