import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

// ── Hoisted Mocks ──

vi.mock("../../../src/lib/config.js", () => ({
  API_BASE_URL: "http://localhost:3000",
}));

// ── Import under test (after mocks) ──

import { buildMediaUrl } from "../../../src/lib/url.js";

describe("buildMediaUrl", () => {
  it("returns null for null input", () => {
    expect(buildMediaUrl(null)).toBeNull();
  });

  it("returns null for empty string input", () => {
    expect(buildMediaUrl("")).toBeNull();
  });

  it("prepends API_BASE_URL to a valid relative path", () => {
    expect(buildMediaUrl("/api/content/123/media")).toBe(
      "http://localhost:3000/api/content/123/media",
    );
  });

  it("prepends API_BASE_URL to a thumbnail path", () => {
    expect(buildMediaUrl("/api/content/123/thumbnail")).toBe(
      "http://localhost:3000/api/content/123/thumbnail",
    );
  });
});
