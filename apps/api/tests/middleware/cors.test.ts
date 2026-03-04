import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

import { TEST_CONFIG } from "../helpers/test-constants.js";

/**
 * CORS middleware tests must isolate `config.CORS_ORIGIN` from the environment.
 *
 * The `corsMiddleware` reads `config.CORS_ORIGIN` eagerly at module load time.
 * To test different CORS_ORIGIN values, we mock the `../src/config.js` module
 * and re-import `cors.ts` per test group.
 */

const setupCorsApp = async (corsOrigin: string): Promise<Hono> => {
  vi.doMock("../../src/config.js", () => ({
    config: { ...TEST_CONFIG, CORS_ORIGIN: corsOrigin },
    parseOrigins: (raw: string) =>
      raw
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean),
  }));
  const { corsMiddleware } = await import("../../src/middleware/cors.js");
  const app = new Hono();
  app.use("*", corsMiddleware);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
};

describe("corsMiddleware", () => {
  describe("with single origin (default)", () => {
    let app: Hono;

    beforeEach(async () => {
      app = await setupCorsApp("http://localhost:3001");
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.resetModules();
    });

    it("sets CORS headers for allowed origin", async () => {
      const res = await app.request("/test", {
        headers: { Origin: "http://localhost:3001" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe(
        "http://localhost:3001",
      );
      expect(res.headers.get("access-control-allow-credentials")).toBe(
        "true",
      );
    });

    it("does not set CORS origin header for disallowed origin", async () => {
      const res = await app.request("/test", {
        headers: { Origin: "http://evil.com" },
      });

      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("responds to preflight OPTIONS with correct methods and headers", async () => {
      const res = await app.request("/test", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3001",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      const allowMethods = res.headers.get("access-control-allow-methods");
      expect(allowMethods).toContain("GET");
      expect(allowMethods).toContain("POST");
      expect(allowMethods).toContain("PATCH");
      expect(allowMethods).toContain("DELETE");
      expect(allowMethods).toContain("OPTIONS");

      const allowHeaders = res.headers.get("access-control-allow-headers");
      expect(allowHeaders).toContain("Content-Type");
      expect(allowHeaders).toContain("Authorization");
    });
  });

  describe("with comma-separated origins", () => {
    let app: Hono;

    beforeEach(async () => {
      app = await setupCorsApp("http://localhost:3001, https://app.example.com");
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.resetModules();
    });

    it("allows the first origin in the comma-separated list", async () => {
      const res = await app.request("/test", {
        headers: { Origin: "http://localhost:3001" },
      });

      expect(res.headers.get("access-control-allow-origin")).toBe(
        "http://localhost:3001",
      );
    });

    it("allows the second origin in the comma-separated list", async () => {
      const res = await app.request("/test", {
        headers: { Origin: "https://app.example.com" },
      });

      expect(res.headers.get("access-control-allow-origin")).toBe(
        "https://app.example.com",
      );
    });

    it("rejects an origin not in the list", async () => {
      const res = await app.request("/test", {
        headers: { Origin: "http://evil.com" },
      });

      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });
  });
});
