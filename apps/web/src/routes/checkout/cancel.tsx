import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";

import styles from "./cancel.module.css";

export const Route = createFileRoute("/checkout/cancel")({
  component: CheckoutCancelPage,
});

function CheckoutCancelPage(): React.ReactElement {
  return (
    <div className={styles.cancelPage}>
      <h1 className={styles.heading}>Checkout was canceled</h1>
      <p className={styles.message}>
        Your subscription was not created. No charges were made.
      </p>
      <Link to="/pricing" className={styles.pricingLink}>
        Back to Pricing
      </Link>
    </div>
  );
}
