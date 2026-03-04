import { z } from "zod";

// ── Public Constants ──

export const PLAN_TYPES = ["platform", "creator"] as const;
export const PLAN_INTERVALS = ["month", "year"] as const;
export const SUBSCRIPTION_STATUSES = [
  "active",
  "canceled",
  "past_due",
  "incomplete",
] as const;

// ── Public Schemas ──

export const PlanTypeSchema = z.enum(PLAN_TYPES);
export const PlanIntervalSchema = z.enum(PLAN_INTERVALS);
export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);

export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PlanTypeSchema,
  creatorId: z.string().nullable(),
  price: z.number().int().min(0),
  interval: PlanIntervalSchema,
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PlansQuerySchema = z.object({
  creatorId: z.string().optional(),
  type: PlanTypeSchema.optional(),
});

export const PlansResponseSchema = z.object({
  plans: z.array(SubscriptionPlanSchema),
});

export const CheckoutRequestSchema = z.object({
  planId: z.string().min(1),
});

export const CheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});

export const CancelRequestSchema = z.object({
  subscriptionId: z.string().min(1),
});

export const UserSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UserSubscriptionWithPlanSchema = UserSubscriptionSchema.extend({
  plan: SubscriptionPlanSchema,
});

export const MySubscriptionsResponseSchema = z.object({
  subscriptions: z.array(UserSubscriptionWithPlanSchema),
});

// ── Public Types ──

export type PlanType = z.infer<typeof PlanTypeSchema>;
export type PlanInterval = z.infer<typeof PlanIntervalSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type PlansQuery = z.infer<typeof PlansQuerySchema>;
export type PlansResponse = z.infer<typeof PlansResponseSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
export type CancelRequest = z.infer<typeof CancelRequestSchema>;
export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;
export type UserSubscriptionWithPlan = z.infer<
  typeof UserSubscriptionWithPlanSchema
>;
export type MySubscriptionsResponse = z.infer<
  typeof MySubscriptionsResponseSchema
>;
