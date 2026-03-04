import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useSession } from "../lib/auth.js";

// ── Public API ──

/**
 * Returns true if the page should render (user is not authenticated).
 * Returns false (and triggers redirect) if user is already authenticated.
 */
export function useGuestRedirect(): boolean {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.data) {
      void navigate({ to: "/feed" });
    }
  }, [session.data, navigate]);

  return !session.isPending && !session.data;
}
