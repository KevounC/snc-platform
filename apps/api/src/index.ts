import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { config } from "./config.js";
import { sql } from "./db/connection.js";

// ── Server ──

const server = serve({
  fetch: app.fetch,
  port: config.PORT,
});

console.log(`Server running on port ${config.PORT}`);

// ── Graceful Shutdown ──

const shutdown = () => {
  server.close(async (err) => {
    if (err) {
      console.error("Error during server shutdown:", err);
      process.exit(1);
    }
    await sql.end();
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
