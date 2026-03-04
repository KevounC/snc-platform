import styles from "./placeholder-page.module.css";

// ── Public API ──

export interface PlaceholderPageProps {
  readonly heading: string;
  readonly subtext?: string;
}

export function PlaceholderPage({
  heading,
  subtext = "Coming soon",
}: PlaceholderPageProps) {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{heading}</h1>
      <p className={styles.subtext}>{subtext}</p>
    </div>
  );
}
