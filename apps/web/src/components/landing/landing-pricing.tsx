import { useState } from "react";
import type React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { SubscriptionPlan } from "@snc/shared";

import { useSession } from "../../lib/auth.js";
import { fetchPlans, createCheckout, hasPlatformSubscription } from "../../lib/subscription.js";
import { useSectionData } from "../../hooks/use-section-data.js";
import { useSubscriptions } from "../../hooks/use-subscriptions.js";
import { PlanCard } from "../subscription/plan-card.js";
import sectionStyles from "../../styles/landing-section.module.css";
import styles from "./landing-pricing.module.css";

// ── Stable fetcher (defined at module scope to avoid re-renders) ──

async function fetchPlatformPlans(): Promise<SubscriptionPlan[]> {
  return fetchPlans({ type: "platform" });
}

// ── Public API ──

export function LandingPricing(): React.ReactElement | null {
  const session = useSession();
  const navigate = useNavigate();
  const { status: fetchStatus, items: plans } = useSectionData(fetchPlatformPlans);
  const subscriptions = useSubscriptions();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const isAuthenticated: boolean = session.data !== null && session.data !== undefined;
  const isSubscribedToPlatform: boolean = hasPlatformSubscription(subscriptions);

  async function handleSubscribe(planId: string): Promise<void> {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
      return;
    }

    setLoadingPlanId(planId);

    try {
      const checkoutUrl = await createCheckout(planId);
      window.location.href = checkoutUrl;
    } catch {
      setLoadingPlanId(null);
    }
  }

  if (fetchStatus === "error") {
    return null;
  }

  return (
    <section className={`${sectionStyles.section} ${styles.sectionElevated}`}>
      <h2 className={`${sectionStyles.heading} ${styles.headingCenter}`}>Get Access to Everything</h2>
      <p className={styles.subheading}>
        Subscribe to the platform and access all content from every creator.
      </p>
      {fetchStatus === "loading" ? (
        <p className={`${sectionStyles.loading} ${styles.loading}`}>Loading plans...</p>
      ) : plans.length === 0 ? (
        <p className={`${sectionStyles.loading} ${styles.loading}`}>Plans coming soon!</p>
      ) : isSubscribedToPlatform ? (
        <div className={styles.subscribedBanner}>
          <p className={styles.subscribedText}>You're subscribed!</p>
          <Link to="/feed" className={styles.subscribedLink}>
            Explore content
          </Link>
        </div>
      ) : (
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={(planId) => void handleSubscribe(planId)}
              isSubscribed={isSubscribedToPlatform}
              isLoading={loadingPlanId === plan.id}
            />
          ))}
        </div>
      )}
      <Link to="/pricing" className={styles.learnMore}>
        Learn more about pricing →
      </Link>
    </section>
  );
}
