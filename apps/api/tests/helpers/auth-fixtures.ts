import type { User, Session } from "@snc/shared";

// ── Public API ──

export const makeMockUser = (overrides?: Partial<User>): User => ({
  id: "user_test123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

export const makeMockSession = (overrides?: Partial<Session>): Session => ({
  id: "session_test456",
  userId: "user_test123",
  token: "tok_test789",
  expiresAt: "2025-02-01T00:00:00Z",
  ...overrides,
});
