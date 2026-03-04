import type React from "react";

import styles from "./video-player.module.css";

// ── Public Types ──

export interface VideoPlayerProps {
  readonly src: string;
  readonly poster?: string;
}

// ── Public API ──

export function VideoPlayer({ src, poster }: VideoPlayerProps): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <video
        className={styles.video}
        controls
        preload="metadata"
        autoPlay={false}
        controlsList="nodownload"
        poster={poster}
        width="100%"
      >
        <source src={src} />
      </video>
    </div>
  );
}
