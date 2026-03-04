import { and, eq, or, gt } from "drizzle-orm";

import { db } from "../db/connection.js";
import {
  userSubscriptions,
  subscriptionPlans,
} from "../db/schema/subscription.schema.js";

// ── Public Types ──

export type ContentGateResult =
  | { allowed: true }
  | { allowed: false; reason: string; creatorId: string };

// ── Public API ──

/**
 * Check whether a user is allowed to access gated content from a specific
 * creator. Enforces subscription-based content gating with the following
 * rules:
 *
 * 1. Public content → always allowed
 * 2. No userId (unauthenticated) → not allowed
 * 3. User is the content creator → allowed (owner bypass)
 * 4. User has an active subscription that covers this creator → allowed
 * 5. Otherwise → not allowed (SUBSCRIPTION_REQUIRED)
 *
 * "Active subscription" means:
 * - status = "active" (or "canceled" if currentPeriodEnd is still in the future)
 * - AND the plan is either platform-wide OR creator-specific matching the
 *   content's creator
 */
export const checkContentAccess = async (
  userId: string | null,
  contentCreatorId: string,
  contentVisibility: string,
): Promise<ContentGateResult> => {
  // Rule 1: Public content is always accessible
  if (contentVisibility === "public") {
    return { allowed: true };
  }

  // Rule 2: Unauthenticated users cannot access gated content
  if (userId === null) {
    return {
      allowed: false,
      reason: "AUTHENTICATION_REQUIRED",
      creatorId: contentCreatorId,
    };
  }

  // Rule 3: Content creator always has access to their own content
  if (userId === contentCreatorId) {
    return { allowed: true };
  }

  // Rule 4: Check for an active subscription covering this creator
  const now = new Date();

  const rows = await db
    .select({ id: userSubscriptions.id })
    .from(userSubscriptions)
    .innerJoin(
      subscriptionPlans,
      eq(userSubscriptions.planId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        // Status must be "active", OR "canceled" with period not yet expired
        or(
          eq(userSubscriptions.status, "active"),
          and(
            eq(userSubscriptions.status, "canceled"),
            gt(userSubscriptions.currentPeriodEnd, now),
          ),
        ),
        // Plan must be platform-wide OR creator-specific for this creator
        or(
          eq(subscriptionPlans.type, "platform"),
          and(
            eq(subscriptionPlans.type, "creator"),
            eq(subscriptionPlans.creatorId, contentCreatorId),
          ),
        ),
      ),
    )
    .limit(1);

  if (rows.length > 0) {
    return { allowed: true };
  }

  // Rule 5: No matching subscription found
  return {
    allowed: false,
    reason: "SUBSCRIPTION_REQUIRED",
    creatorId: contentCreatorId,
  };
};
