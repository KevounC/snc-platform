import { DEMO_MODE } from "../../lib/config.js";
import styles from "./demo-banner.module.css";

// ── Public API ──

export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className={styles.banner} role="status">
      Demo — this is a preview environment. Data may be reset at any time.
    </div>
  );
}
