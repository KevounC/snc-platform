import { eq } from "drizzle-orm";

import type { Role } from "@snc/shared";

import { db } from "../db/connection.js";
import { userRoles } from "../db/schema/user.schema.js";

// ── Public API ──

export const getUserRoles = async (userId: string): Promise<Role[]> => {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  return rows.map((r) => r.role) as Role[];
};
