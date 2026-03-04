import styles from "./footer.module.css";

// ── Public API ──

export function Footer() {
  return (
    <footer className={styles.footer}>
      <hr className={styles.divider} />
      <div className={styles.content}>
        <span>S/NC — A worker-cooperative platform</span>
      </div>
      <div className={styles.copyright}>
        &copy; 2026 —{" "}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">Code: AGPL-3.0</a>
        {" · "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">Docs: CC-BY-SA-4.0</a>
      </div>
    </footer>
  );
}
