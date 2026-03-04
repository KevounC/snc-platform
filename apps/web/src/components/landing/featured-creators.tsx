import type React from "react";
import type { CreatorListResponse } from "@snc/shared";

import { apiGet } from "../../lib/fetch-utils.js";
import { useSectionData } from "../../hooks/use-section-data.js";
import { CreatorCard } from "../creator/creator-card.js";
import sectionStyles from "../../styles/landing-section.module.css";
import styles from "./featured-creators.module.css";

// ── Stable fetcher (defined at module scope to avoid re-renders) ──

async function fetchCreators(): Promise<CreatorListResponse["items"]> {
  const data = await apiGet<CreatorListResponse>("/api/creators", { limit: 8 });
  return data.items;
}

// ── Public API ──

export function FeaturedCreators(): React.ReactElement | null {
  const { status, items } = useSectionData(fetchCreators);

  if (status === "error") {
    return null;
  }

  return (
    <section className={sectionStyles.section}>
      <h2 className={sectionStyles.heading}>Featured Creators</h2>
      {status === "loading" ? (
        <p className={sectionStyles.loading}>Loading creators...</p>
      ) : items.length === 0 ? (
        <p className={sectionStyles.loading}>No creators yet — be the first!</p>
      ) : (
        <div
          className={styles.scrollContainer}
          role="region"
          aria-label="Featured creators"
          tabIndex={0}
        >
          {items.map((creator) => (
            <div key={creator.userId} className={styles.scrollItem}>
              <CreatorCard creator={creator} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
