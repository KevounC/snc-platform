import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type React from "react";
import type { SubscriptionPlan } from "@snc/shared";

import { PlanCard } from "../components/subscription/plan-card.js";
import { useSession } from "../lib/auth.js";
import { fetchPlans, createCheckout, hasPlatformSubscription } from "../lib/subscription.js";
import { useSubscriptions } from "../hooks/use-subscriptions.js";
import styles from "./pricing.module.css";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage(): React.ReactElement {
  const session = useSession();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const subscriptions = useSubscriptions();
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch platform plans on mount
  useEffect(() => {
    let cancelled = false;
    fetchPlans({ type: "platform" })
      .then((result) => {
        if (!cancelled) setPlans(result);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load plans");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPlans(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated: boolean = session.data !== null && session.data !== undefined;
  const isSubscribedToPlatform: boolean = hasPlatformSubscription(subscriptions);

  async function handleSubscribe(planId: string): Promise<void> {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
      return;
    }

    setLoadingPlanId(planId);
    setError(null);

    try {
      const checkoutUrl = await createCheckout(planId);
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setLoadingPlanId(null);
    }
  }

  return (
    <div className={styles.pricingPage}>
      <h1 className={styles.heading}>Platform Subscription</h1>
      <p className={styles.subheading}>
        Get access to all content from every creator on S/NC.
      </p>

      {error !== null && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {isSubscribedToPlatform ? (
        <div className={styles.subscribedBanner}>
          <p className={styles.subscribedText}>You're subscribed!</p>
          <Link to={"/settings/subscriptions" as never} className={styles.manageLink}>
            Manage subscriptions
          </Link>
        </div>
      ) : null}

      {isLoadingPlans ? (
        <p className={styles.status}>Loading plans...</p>
      ) : plans.length === 0 ? (
        <p className={styles.status}>No plans available.</p>
      ) : (
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
              isSubscribed={isSubscribedToPlatform}
              isLoading={loadingPlanId === plan.id}
            />
          ))}
        </div>
      )}

      <p className={styles.creatorNote}>
        Want to support a specific creator? Visit their page to subscribe.
      </p>
    </div>
  );
}
