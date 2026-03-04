import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";

import { SessionSchema, UserSchema } from "@snc/shared";

import { auth } from "../auth/auth.js";
import { getUserRoles } from "../auth/user-roles.js";

// ── Schemas ──

const MeAuthenticatedResponse = z.object({
  user: UserSchema,
  session: SessionSchema,
  roles: z.array(z.string()),
});

const MeUnauthenticatedResponse = z.object({
  user: z.null(),
});

// ── Public API ──

export const meRoutes = new Hono();

meRoutes.get(
  "/",
  describeRoute({
    description:
      "Return the current user's session enriched with roles, or { user: null } when unauthenticated",
    tags: ["me"],
    responses: {
      200: {
        description: "Current user with session and roles, or null user",
        content: {
          "application/json": {
            schema: resolver(
              z.union([MeAuthenticatedResponse, MeUnauthenticatedResponse]),
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const sessionResult = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!sessionResult) {
      return c.json({ user: null });
    }

    const roles = await getUserRoles(sessionResult.user.id);

    return c.json({
      user: {
        ...sessionResult.user,
        image: sessionResult.user.image ?? null,
      },
      session: sessionResult.session,
      roles,
    });
  },
);
