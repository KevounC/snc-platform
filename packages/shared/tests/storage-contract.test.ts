import { describe, it, expect } from "vitest";

import { runStorageContractTests } from "../src/storage-contract.js";

// ── Tests ──

describe("runStorageContractTests", () => {
  it("is a function", () => {
    expect(typeof runStorageContractTests).toBe("function");
  });

  it("accepts two arguments (createProvider, cleanup)", () => {
    expect(runStorageContractTests).toHaveLength(2);
  });
});
