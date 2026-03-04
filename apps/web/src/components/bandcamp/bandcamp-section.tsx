import type React from "react";

import { BandcampEmbed } from "./bandcamp-embed.js";
import styles from "./bandcamp-section.module.css";

// ── Public Types ──

export interface BandcampSectionProps {
  readonly bandcampUrl: string | null;
  readonly bandcampEmbeds: string[];
}

// ── Public API ──

export function BandcampSection({
  bandcampUrl,
  bandcampEmbeds,
}: BandcampSectionProps): React.ReactElement | null {
  if (!bandcampUrl && bandcampEmbeds.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>Bandcamp</h2>

      {bandcampEmbeds.length > 0 && (
        <div className={styles.embedList}>
          {bandcampEmbeds.map((embedUrl) => (
            <BandcampEmbed key={embedUrl} url={embedUrl} />
          ))}
        </div>
      )}

      {bandcampUrl && (
        <a
          href={bandcampUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.externalLink}
        >
          View on Bandcamp
        </a>
      )}
    </section>
  );
}
