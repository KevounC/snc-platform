import type { User, Session, Role } from "@snc/shared";

// ── Types ──

interface MockSessionResult {
  readonly data: { user: User; session: Session } | null;
  readonly isPending: boolean;
  readonly error: Error | null;
}

// ── Public API ──

export function makeMockUser(overrides?: Partial<User>): User {
  return {
    id: "user_test123",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    image: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeMockSession(overrides?: Partial<Session>): Session {
  return {
    id: "session_test456",
    userId: "user_test123",
    token: "tok_test789",
    expiresAt: "2025-02-01T00:00:00Z",
    ...overrides,
  };
}

export function makeMockSessionResult(
  overrides?: Partial<MockSessionResult>,
): MockSessionResult {
  return {
    data: null,
    isPending: false,
    error: null,
    ...overrides,
  };
}

export function makeLoggedInSessionResult(
  userOverrides?: Partial<User>,
): MockSessionResult {
  const user = makeMockUser(userOverrides);
  return {
    data: { user, session: makeMockSession({ userId: user.id }) },
    isPending: false,
    error: null,
  };
}

export type { MockSessionResult, Role };
