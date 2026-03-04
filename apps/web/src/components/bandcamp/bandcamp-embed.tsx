import type React from "react";

import styles from "./bandcamp-embed.module.css";

// ── Private Constants ──

const SMALL_HEIGHT = 120;
const DEFAULT_HEIGHT = 470;
const SMALL_SIZE_PATTERN = /\/size=small\//;

// ── Public Types ──

export interface BandcampEmbedProps {
  readonly url: string;
}

// ── Public API ──

export function BandcampEmbed({ url }: BandcampEmbedProps): React.ReactElement {
  const height = SMALL_SIZE_PATTERN.test(url) ? SMALL_HEIGHT : DEFAULT_HEIGHT;

  return (
    <div className={styles.container}>
      <iframe
        src={url}
        title="Bandcamp Player"
        width="100%"
        height={height}
        frameBorder="0"
        seamless
        sandbox="allow-popups allow-scripts allow-same-origin"
        loading="lazy"
        className={styles.iframe}
      />
    </div>
  );
}
