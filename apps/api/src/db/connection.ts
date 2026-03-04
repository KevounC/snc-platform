import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { config } from "../config.js";

// ── Public API ──

/**
 * Raw postgres.js client. Used for:
 * - Graceful shutdown via `sql.end()` to close the connection pool
 * - Any raw SQL queries not expressible through Drizzle ORM
 */
export const sql = postgres(config.DATABASE_URL);

/**
 * Drizzle ORM instance wrapping the postgres.js client.
 * Used for all typed database queries throughout the application.
 */
export const db = drizzle(sql);
