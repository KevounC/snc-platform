import type { MiddlewareHandler } from "hono";

import type { Role } from "@snc/shared";
import { ForbiddenError } from "@snc/shared";

import { getUserRoles } from "../auth/user-roles.js";

import type { AuthEnv } from "./auth-env.js";

// ── Public API ──

/**
 * Middleware factory that checks if the authenticated user holds at least
 * one of the specified roles. Queries the `userRoles` table and throws
 * `ForbiddenError` (403) if the user lacks all required roles.
 *
 * Must be chained after `requireAuth` (reads `user` from context).
 *
 * Usage: `app.post("/path", requireAuth, requireRole("creator"), handler)`
 */
export const requireRole = (
  ...roles: Role[]
): MiddlewareHandler<AuthEnv> => {
  return async (c, next) => {
    const user = c.get("user");
    const userRoleValues = await getUserRoles(user.id);

    const hasRole = roles.some((required) =>
      userRoleValues.includes(required),
    );

    if (!hasRole) {
      throw new ForbiddenError("Insufficient permissions");
    }

    c.set("roles", userRoleValues);
    await next();
  };
};
