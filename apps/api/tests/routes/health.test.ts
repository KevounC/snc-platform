import { describe, it, expect } from "vitest";

import { app } from "../../src/app.js";

describe("GET /health", () => {
  it("returns 200 with { status: \"ok\" }", async () => {
    const res = await app.request("/health");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toStrictEqual({ status: "ok" });
  });

  it("returns JSON content-type header", async () => {
    const res = await app.request("/health");

    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
