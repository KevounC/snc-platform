import type React from "react";
import { Link } from "@tanstack/react-router";
import type { FeedResponse } from "@snc/shared";

import { apiGet } from "../../lib/fetch-utils.js";
import { useSectionData } from "../../hooks/use-section-data.js";
import { ContentCard } from "../content/content-card.js";
import sectionStyles from "../../styles/landing-section.module.css";
import styles from "./recent-content.module.css";

// ── Stable fetcher (defined at module scope to avoid re-renders) ──

async function fetchRecentContent(): Promise<FeedResponse["items"]> {
  const data = await apiGet<FeedResponse>("/api/content", { limit: 6 });
  return data.items;
}

// ── Public API ──

export function RecentContent(): React.ReactElement | null {
  const { status, items } = useSectionData(fetchRecentContent);

  if (status === "error") {
    return null;
  }

  return (
    <section className={sectionStyles.section}>
      <h2 className={sectionStyles.heading}>Recent Content</h2>
      {status === "loading" ? (
        <p className={sectionStyles.loading}>Loading content...</p>
      ) : items.length === 0 ? (
        <p className={sectionStyles.loading}>No content yet — check back soon!</p>
      ) : (
        <>
          <div className="content-grid">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
          <Link to="/feed" className={styles.viewAll}>
            View all content →
          </Link>
        </>
      )}
    </section>
  );
}
