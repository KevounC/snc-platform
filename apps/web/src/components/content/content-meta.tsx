import type React from "react";

import { formatDate } from "../../lib/format.js";
import styles from "./content-meta.module.css";

// ── Public Types ──

export interface ContentMetaProps {
  readonly title: string;
  readonly creatorName: string;
  readonly publishedAt: string | null;
}

// ── Public API ──

export function ContentMeta({
  title,
  creatorName,
  publishedAt,
}: ContentMetaProps): React.ReactElement {
  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.creator}>
        {creatorName}
        {publishedAt && (
          <>
            <span className={styles.separator}> · </span>
            <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
          </>
        )}
      </p>
    </>
  );
}
