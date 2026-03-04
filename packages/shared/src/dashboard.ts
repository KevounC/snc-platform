import { z } from "zod";

// ── Public Schemas ──

export const MonthlyRevenueSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  amount: z.number().int().min(0), // cents
});

export const RevenueResponseSchema = z.object({
  currentMonth: z.number().int().min(0), // cents — sum of current month
  monthly: z.array(MonthlyRevenueSchema),
});

export const SubscriberSummarySchema = z.object({
  active: z.number().int().min(0),
});

export const BookingSummarySchema = z.object({
  pending: z.number().int().min(0),
  total: z.number().int().min(0),
});

// ── Public Types ──

export type MonthlyRevenue = z.infer<typeof MonthlyRevenueSchema>;
export type RevenueResponse = z.infer<typeof RevenueResponseSchema>;
export type SubscriberSummary = z.infer<typeof SubscriberSummarySchema>;
export type BookingSummary = z.infer<typeof BookingSummarySchema>;
