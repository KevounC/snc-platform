import { createFileRoute, Link } from "@tanstack/react-router";

import { useGuestRedirect } from "../hooks/use-guest-redirect.js";
import { LoginForm } from "../components/auth/login-form.js";
import styles from "../components/auth/auth-form.module.css";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const shouldRender = useGuestRedirect();

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Log in to S/NC</h1>
      <LoginForm />
      <p className={styles.altLink}>
        Don&apos;t have an account?{" "}
        <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
