import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/connection.js";
import { config, parseOrigins } from "../config.js";
import * as schema from "../db/schema/user.schema.js";
import { userRoles } from "../db/schema/user.schema.js";

// ── Public API ──

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: parseOrigins(config.CORS_ORIGIN),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(userRoles).values({
            userId: user.id,
            role: "subscriber",
          });
        },
      },
    },
  },
});
